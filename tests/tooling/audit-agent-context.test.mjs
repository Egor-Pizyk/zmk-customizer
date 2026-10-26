import assert from 'node:assert/strict';
import { test } from 'node:test';
import path from 'node:path';
import { auditDocuments } from '../../scripts/audit-agent-context.mjs';

test('resolves local links relative to each document, decodes spaces and ignores external links and code examples', () => {
  const root = path.resolve('/repository');
  const source =
    '[guide](../guide.md#scope) [space](<../a%20b.md>) [missing](lost.md) [external](https://example.com) [anchor](#local)\n\n```md\n[example](fake.md)\n```';
  const report = auditDocuments(new Map([['docs/nested/rules.md', source]]), {
    root,
    exists: (file) =>
      [path.join(root, 'docs/guide.md'), path.join(root, 'docs/a b.md')].includes(file),
  });
  assert.deepEqual(report.missingLinks, [{ file: 'docs/nested/rules.md', target: 'lost.md' }]);
});

test('reports malformed link encoding as a finding rather than losing the audit', () => {
  const report = auditDocuments(new Map([['AGENTS.md', '[bad](%ZZ.md)']]), {
    root: '/repository',
    exists: () => false,
  });
  assert.deepEqual(report.missingLinks, [{ file: 'AGENTS.md', target: '%ZZ.md' }]);
});

test('counts startup once per file and detects prose shared by different files', () => {
  const paragraph = Array.from({ length: 40 }, (_, index) => `word${index}`).join(' ');
  const report = auditDocuments(
    new Map([
      ['AGENTS.md', `${paragraph}\n\n${paragraph}`],
      ['docs/agent-rules.md', paragraph],
      ['docs/guidelines/example.md', 'brief'],
    ]),
    { root: '/repository', exists: () => true },
  );
  assert.equal(report.startupWords, 120);
  assert.equal(report.totalWords, 121);
  assert.deepEqual(report.repeatedParagraphs, [
    { words: 40, files: ['AGENTS.md', 'docs/agent-rules.md'] },
  ]);
});
