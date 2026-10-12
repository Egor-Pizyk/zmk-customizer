import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseSource, walk, sourceFiles } from './check-architecture.mjs';

export function checkGuidelines({
  sources,
  registry,
  manifest,
  rules,
  documents = new Map(),
  exists = existsSync,
}) {
  const issues = [];
  const expected = new Set(
    [
      ...registry
        .split('\n')
        .filter((line) => line.startsWith('|'))
        .map((line) => line.split('|')[2]?.match(/`[^`]+`/u)?.[0] ?? '')
        .join('\n')
        .matchAll(/`([^`]+\.[jt]sx?)`/gu),
    ].map((match) => `src/ui/${match[1]}`),
  );
  const actual = new Set();
  for (const [file, source] of sources) {
    if (!file.startsWith('src/ui/') || /\.test\./u.test(file)) continue;
    const hooks = new Set();
    const namespaces = new Set();
    const ast = parseSource(file, source);
    walk(ast, (node) => {
      if (node.type !== 'ImportDeclaration' || node.source.value !== 'react') return;
      for (const item of node.specifiers) {
        if (item.type === 'ImportNamespaceSpecifier' || item.type === 'ImportDefaultSpecifier')
          namespaces.add(item.local.name);
        if (['useEffect', 'useLayoutEffect', 'useInsertionEffect'].includes(item.imported?.name))
          hooks.add(item.local.name);
      }
    });
    walk(ast, (node) => {
      if (node.type !== 'CallExpression') return;
      const callee = node.callee;
      if (
        hooks.has(callee.name) ||
        (namespaces.has(callee.object?.name) &&
          ['useEffect', 'useLayoutEffect', 'useInsertionEffect'].includes(callee.property?.name))
      )
        actual.add(file);
    });
  }
  for (const file of new Set([...actual, ...expected])) {
    if (actual.has(file) !== expected.has(file)) issues.push({ rule: 'effect-registry', file });
  }
  for (const match of manifest.matchAll(
    /`((?:eslint|typescript|unicorn|import|react)\/[^`]+)`/gu,
  )) {
    const value = rules[match[1]];
    const severity = Array.isArray(value) ? value[0] : value;
    if (severity !== 'error' && severity !== 2)
      issues.push({ rule: 'enforcement', file: match[1] });
  }
  for (const [file, source] of documents) {
    for (const match of source.matchAll(/\]\(([^)]+)\)/gu)) {
      const target = match[1].split('#')[0];
      if (!target || /^(?:https?:|mailto:|\/)/u.test(target)) continue;
      if (!exists(path.resolve(path.dirname(file), target)))
        issues.push({ rule: 'document-link', file, target });
    }
  }
  return issues;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const react = readFileSync('docs/guidelines/frontend/react.md', 'utf8');
  const control = readFileSync('docs/guidelines/code-quality/control-flow.md', 'utf8');
  const config = readFileSync('.oxlintrc.json', 'utf8').replace(/^\s*\/\/.*$/gmu, '');
  const issues = checkGuidelines({
    sources: new Map(sourceFiles().map((file) => [file, readFileSync(file, 'utf8')])),
    registry: react.split('## Effects')[1].split('## Inputs')[0],
    manifest: control.split('## Enforced by')[1],
    rules: JSON.parse(config).rules,
    documents: new Map(
      readdirSync('docs/guidelines', { recursive: true })
        .filter((file) => file.endsWith('.md'))
        .map((file) => `docs/guidelines/${file}`)
        .map((file) => [file, readFileSync(file, 'utf8')]),
    ),
  });
  for (const issue of issues)
    process.stderr.write(
      `${issue.rule}: ${issue.file}${issue.target ? ` -> ${issue.target}` : ''}\n`,
    );
  process.exitCode = issues.length ? 1 : 0;
}
