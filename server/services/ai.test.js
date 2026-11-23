import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { FilePlanSchema } from './aiSchemas.js';

let generate;
mock.module('ai', { namedExports: { generateObject: (options) => generate(options) } });
mock.module('@ai-sdk/openai', { namedExports: { createOpenAI: () => () => 'test-model' } });
const { generateProject } = await import('./ai.js');

function generation(t, failures) {
    for (const method of ['log', 'warn', 'error']) t.mock.method(console, method, () => {});
    const attempts = {};
    generate = async ({ schema, prompt }) => {
        if (schema === FilePlanSchema) {
            return { object: {
                files: ['/App.js', '/styles.css'].map((path) => ({ path, description: path })),
                projectDescription: 'Test project',
            } };
        }
        const path = prompt.match(/Write the complete code for: (.+)\n/)[1];
        attempts[path] = (attempts[path] || 0) + 1;
        if (attempts[path] <= (failures[path] ?? 0)) throw new Error('Provider failed');
        return { object: { code: path.endsWith('.css')
            ? 'body { color: black; }'
            : 'export default function App() { return null; }' } };
    };
    return attempts;
}

test('exhausted entry point retries throw a descriptive error instead of ReferenceError', async (t) => {
    const attempts = generation(t, { '/App.js': Infinity });
    const completed = [];
    await assert.rejects(generateProject('Test', {
        onFileComplete: async (path) => { completed.push(path); },
    }), (error) => {
        assert.equal(error.name, 'Error');
        assert.match(error.message, /App\.js.*after all retry rounds/);
        return true;
    });
    assert.equal(attempts['/App.js'], 3);
    assert.equal(attempts['/styles.css'], 1);
    assert.deepEqual(completed, ['/styles.css']);
});

test('entry point generation can recover during retries', async (t) => {
    const attempts = generation(t, { '/App.js': 1 });
    const result = await generateProject('Test');
    assert.equal(attempts['/App.js'], 2);
    assert.equal(attempts['/styles.css'], 1);
    assert.match(result.files['/App.js'], /export default function App/);
    assert.match(result.files['/styles.css'], /color: black/);
    assert.equal(result.description, 'Test project');
});

test('non-entry failures retain partial results for controller validation', async (t) => {
    const attempts = generation(t, { '/styles.css': Infinity });
    const result = await generateProject('Test');
    assert.equal(attempts['/App.js'], 1);
    assert.equal(attempts['/styles.css'], 3);
    assert.ok(result.files['/App.js']);
    assert.equal(result.files['/styles.css'], undefined);
});
