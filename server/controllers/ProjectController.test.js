import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import Project from '../models/Project.js';

mock.module('../services/ai.js', {
    namedExports: { generateProject: async () => { throw new Error('Unexpected AI call'); } },
});
const { recoverInterruptedGenerations, getProject } = await import('./ProjectController.js');

test('startup recovery ends interrupted generation, preserves partial files, and is idempotent', async (t) => {
    const owner = '000000000000000000000002';
    const records = [
        {
            _id: '000000000000000000000001', owner, status: 'generating',
            files: { '/App.js': { content: 'partial source', hash: 'saved-hash' } },
            filesRevision: 3, filesGenerated: ['/App.js'],
            filesplaned: [{ path: '/App.js', description: 'Entry point' }, { path: '/styles.css', description: 'Styles' }],
            currentFile: '/styles.css', messages: [], version: 1,
        },
        {
            _id: '000000000000000000000003', owner, status: 'generating',
            files: {}, filesGenerated: [], currentFile: null, messages: [],
        },
        { status: 'completed', files: { '/App.js': 'complete' }, messages: [] },
        { status: 'failed', error: 'Previous failure', messages: [] },
        { status: 'revising', messages: [] },
    ];
    const before = structuredClone(records);
    // Exercise real Mongoose query casting; replace only the database boundary.
    t.mock.method(Project.collection, 'updateMany', async (filter, update) => {
        assert.deepEqual(filter, { status: 'generating' });
        assert.equal(update.$set.files, undefined);
        assert.equal(update.$set.filesGenerated, undefined);
        assert.equal(update.$inc, undefined);
        const persisted = JSON.parse(JSON.stringify(update));
        let modifiedCount = 0;
        for (const project of records) {
            if (project.status !== filter.status) continue;
            Object.assign(project, persisted.$set);
            project.messages.push(persisted.$push.messages);
            modifiedCount++;
        }
        return { acknowledged: true, modifiedCount };
    });
    await recoverInterruptedGenerations();
    for (const index of [0, 1]) {
        assert.equal(records[index].status, 'failed');
        assert.equal(records[index].currentFile, null);
        assert.match(records[index].error, /restart.*Partial files were kept.*original prompt to retry/);
        assert.deepEqual(records[index].files, before[index].files);
        assert.deepEqual(records[index].filesGenerated, before[index].filesGenerated);
        assert.deepEqual(records[index].filesplaned, before[index].filesplaned);
        assert.equal(records[index].filesRevision, before[index].filesRevision);
        assert.equal(records[index].messages.length, 1);
    }
    assert.deepEqual(records.slice(2), before.slice(2));
    const recovered = structuredClone(records);
    await recoverInterruptedGenerations();
    assert.deepEqual(records, recovered);

    t.mock.method(Project.collection, 'findOne', async () => records[0]);
    const res = {
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };
    await getProject({ auth: { userId: owner }, params: { id: records[0]._id } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'failed');
    assert.equal(res.body.files['/App.js'], 'partial source');
    assert.equal(res.body.currentFile, null);
    assert.equal(res.body.error, records[0].error);
});

test('recovery database errors propagate so startup cannot accept requests with stuck projects', async (t) => {
    t.mock.method(Project.collection, 'updateMany', async () => { throw new Error('Database unavailable'); });
    await assert.rejects(recoverInterruptedGenerations(), /Database unavailable/);
});
