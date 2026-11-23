import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAndFixCode, validateRevisionContent } from './codeValidator.js';

const wrap = (jsx) => `import React from 'react';\nexport default function App() { return (${jsx}); }\n`;
const paths = {
    'full file': (jsx) => validateAndFixCode(wrap(jsx), '/App.jsx').code,
    'revision create': (jsx) => validateRevisionContent(wrap(jsx), '/App.jsx', 'create').content,
    'revision replacement': (jsx) => validateRevisionContent(jsx, '/App.jsx', 'update').content,
};
const cases = [
    ['self-closing arrow handler', '<input onChange={(e) => setValue(e.target.value)} />'],
    ['unclosed arrow handler', '<input onChange={(e) => setValue(e.target.value)}>', '<input onChange={(e) => setValue(e.target.value)} />'],
    ['nested braces and comparisons', '<input onChange={() => { if (a > b) save({ value: ">}" }); }}>', '<input onChange={() => { if (a > b) save({ value: ">}" }); }} />'],
    ['quoted attributes', '<img alt="a > b" src=\'image.png\'>', '<img alt="a > b" src=\'image.png\' />'],
    ['template in handler', '<input onChange={() => save(`text > } <img>`)}>', '<input onChange={() => save(`text > } <img>`)} />'],
    ['nested template interpolation', '<input onChange={() => save(`outer ${`inner } >`}`)} />'],
    ['regex in handler', '<input onChange={(e) => /[}>"/]/.test(e.target.value)}>', '<input onChange={(e) => /[}>"/]/.test(e.target.value)} />'],
    ['comment in handler', '<input onChange={() => { /* } > */ save(); }}>', '<input onChange={() => { /* } > */ save(); }} />'],
    ['multiline handler', '<input\n onChange={() => {\n // } >\n save();\n }}\n>', '<input\n onChange={() => {\n // } >\n save();\n }}\n/>'],
    ['custom tag boundary', '<input-widget onChange={() => save()}></input-widget>'],
    ['incomplete tag', '<input onChange={() => save()}'],
    ['multiple elements', '<><br/><hr><img src="x" /></>', '<><br/><hr /><img src="x" /></>'],
];

for (const [path, validate] of Object.entries(paths)) {
    for (const [name, input, expected = input] of cases) {
        test(`${path}: ${name}`, () => {
            const result = validate(input);
            assert.equal(result, path === 'revision replacement' ? expected : wrap(expected));
            assert.equal(validate(expected), result);
        });
    }
}

for (const path of ['full file', 'revision create', 'revision replacement']) {
    test(`${path}: preserves JavaScript object-property values resembling type names`, () => {
        const source = 'const object = { id: 1 };\nconst result = Object.freeze({ data: object, ok: true });\n';
        const result = path === 'full file'
            ? validateAndFixCode(source, '/data.js').code
            : validateRevisionContent(source, '/data.js', path === 'revision create' ? 'create' : 'update').content;
        assert.equal(result, source);
        assert.deepEqual(new Function(`${result}\nreturn result;`)(), { data: { id: 1 }, ok: true });
    });
    test(`${path}: preserves object values named string, number, boolean, and any`, () => {
        for (const value of ['string', 'number', 'boolean', 'any']) {
            const source = `const ${value} = 42;\nconst result = ({ data: ${value}, ok: true });\n`;
            const result = path === 'full file'
                ? validateAndFixCode(source, '/data.js').code
                : validateRevisionContent(source, '/data.js', path === 'revision create' ? 'create' : 'update').content;
            assert.equal(result, source);
            assert.deepEqual(new Function(`${result}\nreturn result;`)(), { data: 42, ok: true });
        }
    });
}

test('leaves parameter annotations unchanged without a TypeScript parser', () => {
    const source = 'const identity = (props: any) => props;\n';
    const result = validateAndFixCode(source, '/data.js');
    assert.equal(result.code, source);
    assert.deepEqual(result.warnings, []);
});

for (const mode of ['full file', 'revision create']) {
    const validate = (source) => mode === 'full file'
        ? validateAndFixCode(source, '/App.jsx')
        : validateRevisionContent(source, '/App.jsx', 'create');
    for (const declaration of [
        "import React from 'react';",
        "import React, { useState } from 'react';",
        "import React, * as ReactAPI from 'react';",
        "import * as React from 'react';",
        'import * as React from "react";',
        "import *\n as React\n from 'react';",
    ]) {
        test(`${mode}: preserves existing React binding: ${JSON.stringify(declaration)}`, () => {
            const source = `${declaration}\nexport default function App() { return <div />; }\n`;
            const result = validate(source);
            assert.equal(result.code ?? result.content, source);
            assert.ok(!result.warnings.some((warning) => warning.includes('Added missing React import')));
        });
    }
    test(`${mode}: still inserts a missing default React import`, () => {
        const source = 'export default function App() { return <div />; }\n';
        const result = validate(source);
        assert.equal(result.code ?? result.content, `import React from 'react';\n${source}`);
        assert.ok(result.warnings.some((warning) => warning.includes('Added missing React import')));
    });
}
