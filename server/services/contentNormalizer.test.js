import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeContent } from './contentNormalizer.js';
import { applyOperations } from './diff.js';

test('preserves escaped quotes in generated JavaScript strings', () => {
    const code = String.raw`const markup = "<div className=\"relative\">Hello</div>";`;
    assert.equal(normalizeContent(code), code);
    assert.doesNotThrow(() => new Function(normalizeContent(code)));
});

test('preserves revision content, search, and replacement fields', () => {
    const original = String.raw`const markup = "<div className=\"relative\">Hello</div>";`;
    const replacement = String.raw`const markup = "<div className=\"absolute\">Hello</div>";`;
    const result = applyOperations({}, [
        { op: 'create', path: 'example.js', content: normalizeContent(original) },
        {
            op: 'update', path: 'example.js',
            search: normalizeContent(original), replace: normalizeContent(replacement),
        },
    ]);
    assert.deepEqual(result.errors, []);
    assert.equal(result.files['example.js'].content, replacement);
});

test('retains BOM, line ending, and escaped newline normalization', () => {
    assert.equal(normalizeContent('\uFEFFfirst\r\nsecond\rthird'), 'first\nsecond\nthird');
    assert.equal(normalizeContent(String.raw`first\nsecond`), 'first\nsecond');
    assert.equal(normalizeContent(''), '');
});
