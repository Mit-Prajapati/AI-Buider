import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import Project from '../models/Project.js';
import { hashContent } from '../services/diff.js';

mock.module('../services/ai.js', {
    namedExports: {
        reviseProject: async () => ({
            operations: [{ op: 'create', path: '/App.js', content: 'revised' }],
            description: 'Revision complete.',
        }),
        generateProject: async () => { throw new Error('Unexpected generation call'); },
    },
});
const { chat } = await import('./chatController.js');
const { updateProjectFiles } = await import('./ProjectController.js');

const projectId = '000000000000000000000001';
const ownerId = '000000000000000000000002';
const entry = (content) => ({ content, hash: hashContent(content) });
const clone = (value) => JSON.parse(JSON.stringify(value));
const response = () => ({
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
});
const request = (body) => ({ auth: { userId: ownerId }, params: { id: projectId }, body });

// Mock only MongoDB I/O: controllers, Mongoose casting, middleware, and update
// construction all run normally. The commit callback controls the race timing.
function database(t, filesRevision) {
    const stored = {
        _id: projectId, owner: ownerId, name: 'Test', status: 'completed',
        files: { '/App.js': entry('original') }, version: 1, messages: [], __v: 0,
        description: '', published: false, errors: [], filesplaned: [],
        filesGenerated: ['/App.js'], currentFile: null, error: null,
    };
    if (filesRevision !== undefined) stored.filesRevision = filesRevision;
    const writes = [];
    const matches = (filter) => Object.entries(filter).every(([key, value]) => {
        if (value && typeof value === 'object' && '$in' in value) {
            return value.$in.some((candidate) => candidate == null
                ? stored[key] == null : candidate === stored[key]);
        }
        return String(stored[key]) === String(value);
    });
    const set = (path, value) => {
        const keys = path.split('.');
        let target = stored;
        for (const key of keys.slice(0, -1)) target = target[key] ??= {};
        target[keys.at(-1)] = clone(value);
    };
    const apply = (update) => {
        writes.push(update);
        for (const [path, value] of Object.entries(update.$set || {})) set(path, value);
        for (const [path, value] of Object.entries(update.$inc || {})) {
            stored[path] = (stored[path] ?? 0) + value;
        }
        for (const [path, value] of Object.entries(update.$push || {})) {
            (stored[path] ??= []).push(...clone(value.$each ?? [value]));
        }
    };
    const db = { stored, writes, beforeSave: null, beforeCommit: null, commitFilter: null };
    t.mock.method(Project.collection, 'findOne', async (filter) =>
        matches(filter) ? clone(stored) : null);
    t.mock.method(Project.collection, 'updateOne', async (filter, update) => {
        const beforeSave = db.beforeSave;
        db.beforeSave = null;
        await beforeSave?.();
        if (!matches(filter)) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
        apply(update);
        return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    });
    t.mock.method(Project.collection, 'findOneAndUpdate', async (filter, update) => {
        db.commitFilter = filter;
        await db.beforeCommit?.();
        if (!matches(filter)) return null;
        apply(update);
        return clone(stored);
    });
    return db;
}

test('manual saves are rejected during initial generation and allowed after completion', async (t) => {
    const db = database(t, 4);
    db.stored.status = 'generating';
    const before = clone(db.stored);
    const blocked = response();
    await updateProjectFiles(request({ files: { '/App.js': 'manual' } }), blocked);
    assert.equal(blocked.statusCode, 409);
    assert.match(blocked.body.error, /generation.*finish/i);
    assert.deepEqual(db.stored, before);
    assert.equal(db.writes.length, 0);

    db.stored.status = 'completed';
    const saved = response();
    await updateProjectFiles(request({ files: { '/App.js': 'manual' } }), saved);
    assert.equal(saved.statusCode, 200);
    assert.equal(saved.body.files['/App.js'], 'manual');
    assert.deepEqual(db.stored.files['/App.js'], entry('manual'));
    assert.equal(db.stored.filesRevision, 5);
});

for (const status of ['failed', 'revising']) {
    test(`manual saves remain available while project is ${status}`, async (t) => {
        const db = database(t, 4);
        db.stored.status = status;
        const res = response();
        await updateProjectFiles(request({ files: { '/App.js': 'manual' } }), res);
        assert.equal(res.statusCode, 200);
        assert.equal(db.stored.files['/App.js'].content, 'manual');
        assert.equal(db.stored.filesRevision, 5);
        assert.equal(db.stored.status, status);
    });
}

for (const marker of [4, 0, undefined]) {
    test(`revision commits unchanged snapshot (marker ${marker ?? 'missing'})`, async (t) => {
        const db = database(t, marker);
        const res = response();
        await chat(request({ prompt: 'Revise' }), res);
        assert.equal(res.statusCode, 200);
        assert.equal(db.stored.files['/App.js'].content, 'revised');
        assert.equal(db.stored.filesRevision, (marker ?? 0) + 1);
        assert.equal(db.stored.version, 2);
        assert.equal(String(db.commitFilter._id), projectId);
        assert.equal(String(db.commitFilter.owner), ownerId);
        assert.equal(res.body.files['/App.js'], 'revised');
        assert.equal(res.body.filesRevision, undefined);
    });
}

for (const revert of [false, true]) {
    test(`manual save immediately before commit returns 409${revert ? ' even after reverting files' : ''}`, async (t) => {
        const db = database(t, 4);
        db.beforeCommit = async () => {
            const manual = response();
            await updateProjectFiles(request({ files: { '/App.js': 'manual' } }), manual);
            assert.equal(manual.statusCode, 200);
            assert.equal(db.stored.filesRevision, 5);
            if (revert) {
                const reverted = response();
                await updateProjectFiles(request({ files: { '/App.js': 'original' } }), reverted);
                assert.equal(reverted.statusCode, 200);
            }
        };
        const res = response();
        await chat(request({ prompt: 'Revise' }), res);
        assert.equal(res.statusCode, 409);
        assert.equal(res.body.error, 'Project files changed during revision. Please send the request again.');
        assert.equal(db.stored.files['/App.js'].content, revert ? 'original' : 'manual');
        assert.equal(db.stored.filesRevision, revert ? 6 : 5);
        assert.equal(db.stored.version, 1);
        assert.equal(db.stored.status, 'completed');
        assert.equal(db.commitFilter.filesRevision, 4);
    });
}

test('legacy metadata save cannot reset the marker after a concurrent manual save', async (t) => {
    const db = database(t);
    db.beforeSave = async () => {
        const manual = response();
        await updateProjectFiles(request({ files: { '/App.js': 'manual' } }), manual);
        assert.equal(manual.statusCode, 200);
    };
    const res = response();
    await chat(request({ prompt: 'Revise' }), res);
    assert.equal(res.statusCode, 409);
    assert.equal(db.stored.files['/App.js'].content, 'manual');
    assert.equal(db.stored.filesRevision, 1);
});

test('file saves advance the marker atomically for stale documents and nested generation writes', async (t) => {
    const db = database(t, 4);
    const first = await Project.findById(projectId);
    const stale = await Project.findById(projectId);
    first.files = { '/App.js': entry('first') };
    first.markModified('files');
    await first.save();
    stale.files['/App.js'] = entry('second');
    stale.markModified('files');
    await stale.save();
    assert.equal(db.stored.filesRevision, 6);
    assert.equal(db.stored.files['/App.js'].content, 'second');
    assert.equal(db.writes[0].$inc.filesRevision, 1);
    assert.equal(db.writes[1].$inc.filesRevision, 1);
    const metadata = await Project.findById(projectId);
    metadata.status = 'completed';
    metadata.error = 'Metadata only';
    await metadata.save();
    assert.equal(db.stored.filesRevision, 6);
});
