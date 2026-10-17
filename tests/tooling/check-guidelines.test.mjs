import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkGuidelines } from '../../scripts/check-guidelines.mjs';

test('detects missing and stale effects using parsed imports, including aliases', () => {
  const sources = new Map([
    ['src/ui/probe.tsx', "import { useEffect as sync } from 'react'; sync(() => {}, []);"],
  ]);
  assert.deepEqual(
    checkGuidelines({ sources, registry: '', manifest: '', rules: {} }).map((x) => x.rule),
    ['effect-registry'],
  );
  assert.deepEqual(
    checkGuidelines({
      sources: new Map(),
      registry: '| effect | `probe.tsx` |',
      manifest: '',
      rules: {},
    }).map((x) => x.rule),
    ['effect-registry'],
  );
});
test('checks enabled enforcement rules and local links', () => {
  assert.equal(
    checkGuidelines({
      sources: new Map(),
      registry: '',
      manifest: '`eslint/max-depth`',
      rules: { 'eslint/max-depth': 'off' },
    })[0].rule,
    'enforcement',
  );
  assert.deepEqual(
    checkGuidelines({
      sources: new Map(),
      registry: '',
      manifest: '`eslint/max-depth`',
      rules: { 'eslint/max-depth': ['error', 3] },
    }),
    [],
  );
});

test('detects broken relative guideline links', () => {
  assert.deepEqual(
    checkGuidelines({
      sources: new Map(),
      registry: '',
      manifest: '',
      rules: {},
      documents: new Map([['docs/rule.md', '[missing](missing.md)']]),
      exists: () => false,
    }).map((x) => x.rule),
    ['document-link'],
  );
});

const cases = JSON.parse(
  readFileSync(new URL('../fixtures/guidelines/cases.json', import.meta.url), 'utf8'),
);
for (const [index, fixture] of cases.entries()) {
  test(`effect fixture ${index}`, () => {
    const issues = checkGuidelines({
      sources: new Map([[fixture.file, fixture.source]]),
      registry: fixture.registry,
      manifest: '',
      rules: {},
    });
    assert.deepEqual(
      issues.map((issue) => issue.rule),
      fixture.diagnostic === null ? [] : [fixture.diagnostic],
    );
  });
}

test('effect registry inventories files, leaving additional effect semantics to review', () => {
  assert.deepEqual(
    checkGuidelines({
      sources: new Map([
        [
          'src/ui/probe.ts',
          "import {useEffect} from 'react'; useEffect(()=>{},[]); useEffect(()=>{},[]);",
        ],
      ]),
      registry: '| effects | `probe.ts` |',
      manifest: '',
      rules: {},
    }),
    [],
  );
});
