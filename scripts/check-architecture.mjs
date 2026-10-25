import { parse } from '@babel/parser';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkModuleImport, resolveProjectImport } from './module-imports.mjs';
import { resolvePublicExports } from './resolve-public-exports.mjs';

// Mixed query modules grant UI access only to these public, non-analysis contracts.
const UI_WIRE_FILES = new Set([
  'board-pin',
  'can-add-wire',
  'find-board-pin-user',
  'find-free-end-position',
  'find-key-current-flow',
  'find-nearest-key-pin',
  'get-key-pin-wires',
  'get-wire-sections',
  'remove-orphan-wires',
]);
const UI_CROSSING_FILES = new Set(['toggle-crossing-insulation']);

const PURE_LAYERS = new Set(['domain', 'catalog', 'generators']);
const IO_NAMES = new Set([
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'Worker',
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'queueMicrotask',
]);
const ROOT_UI = new Set([
  'project',
  'preferences',
  'navigation',
  'shortcuts',
  'dialogs',
  'downloads',
  'issues',
  'onboarding',
]);
const FEATURES = new Set(['schematic', 'bindings', 'firmware', 'export']);

export function parseSource(file, source) {
  return parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    sourceFilename: file,
  });
}

export function walk(node, visit, parent) {
  if (node === null || typeof node !== 'object') {
    return;
  }
  if (typeof node.type === 'string') {
    visit(node, parent);
  }
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'start', 'end', 'comments', 'tokens'].includes(key)) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const child of value) {
        walk(child, visit, node);
      }
    } else if (value && typeof value === 'object') {
      walk(value, visit, node);
    }
  }
}

function allowedEdge(file, target, typeOnly) {
  const [, layer, group] = file.split('/');
  const [, targetLayer, targetGroup] = target.split('/');
  if (layer === 'ui' && targetLayer === 'domain' && !typeOnly) {
    const engineModule =
      target.startsWith('src/domain/wiring/matrix/') ||
      target.startsWith('src/domain/wires/nets/') ||
      target.startsWith('src/domain/validation/');
    const mixedQueryModule = path.posix.dirname(target);
    const name = path.posix.basename(target, '.ts');
    if (mixedQueryModule === 'src/domain/wires' && !UI_WIRE_FILES.has(name)) return false;
    if (mixedQueryModule === 'src/domain/crossings' && !UI_CROSSING_FILES.has(name)) return false;
    if (
      target.startsWith('src/domain/analysis/') &&
      file !== 'src/ui/project/logic/project-state.ts'
    )
      return false;
    if (engineModule) return false;
  }
  if (layer === 'domain') {
    return targetLayer === 'domain';
  }
  if (layer === 'catalog') {
    return targetLayer === 'catalog' || (targetLayer === 'domain' && typeOnly);
  }
  if (layer === 'generators') {
    return ['generators', 'domain', 'catalog'].includes(targetLayer);
  }
  if (layer === 'storage') {
    return ['storage', 'domain', 'catalog', 'generators'].includes(targetLayer);
  }
  if (file === 'src/main.tsx' && target === 'src/styles.css') {
    return true;
  }
  if (file === 'src/main.tsx') {
    return ['ui', 'storage', 'catalog'].includes(targetLayer);
  }
  if (layer !== 'ui') {
    return false;
  }
  if (group === 'components') {
    return targetLayer === 'ui' && targetGroup === 'components';
  }
  if (['domain', 'catalog', 'storage'].includes(targetLayer)) {
    return true;
  }
  if (targetLayer === 'generators') {
    return (
      file === 'src/ui/export/logic/get-export-preview.ts' ||
      (group === 'export' &&
        typeOnly &&
        target.replace(/\.ts$/u, '') === 'src/generators/generated-file')
    );
  }
  if (targetLayer !== 'ui') {
    return false;
  }
  if (!FEATURES.has(group) && !['canvas', 'shell'].includes(group)) {
    return group === 'app' || (!FEATURES.has(targetGroup) && targetGroup !== 'app');
  }
  if (FEATURES.has(targetGroup)) {
    return group === targetGroup;
  }
  if (['components', 'canvas', 'shell'].includes(targetGroup)) {
    return true;
  }
  return ROOT_UI.has(targetGroup.replace(/\.(?:tsx?|jsx?)$/u, ''));
}

function propertyName(node) {
  return node?.type === 'Identifier' ? node.name : node?.value;
}

export function checkSource(file, source, { loadSource } = {}) {
  const issues = [];
  const ast = parseSource(file, source);
  const isTest = /\.test\.[cm]?[jt]sx?$/u.test(file);
  if (isTest && file.startsWith('src/')) {
    issues.push({
      file,
      line: 1,
      rule: 'test-location',
      message: 'Tests belong in tests/unit, outside production source folders',
    });
  }
  const isPure = !isTest && PURE_LAYERS.has(file.split('/')[1]);
  const aliases = new Map();
  function origin(node) {
    if (node?.type === 'Identifier') {
      return aliases.get(node.name) ?? node.name;
    }
    if (['MemberExpression', 'OptionalMemberExpression'].includes(node?.type)) {
      return `${origin(node.object)}.${propertyName(node.property)}`;
    }
    return '';
  }
  walk(ast, (node) => {
    if (node.type === 'ImportDeclaration' && node.source.value === 'vitest') {
      for (const item of node.specifiers) {
        if (item.imported?.name) aliases.set(item.local.name, item.imported.name);
      }
    }
  });
  // A bounded fixed point resolves aliases declared in any order without executing code.
  for (let pass = 0; pass < 8; pass += 1) {
    walk(ast, (node) => {
      if (node.type !== 'VariableDeclarator' || !node.init) {
        return;
      }
      if (node.id.type === 'Identifier') {
        aliases.set(node.id.name, origin(node.init));
      }
      if (node.id.type === 'ObjectPattern') {
        for (const property of node.id.properties) {
          if (property.type === 'ObjectProperty' && property.value.type === 'Identifier') {
            aliases.set(property.value.name, `${origin(node.init)}.${propertyName(property.key)}`);
          }
        }
      }
    });
  }
  function report(node, rule, message) {
    issues.push({ file, line: node.loc?.start.line ?? 1, rule, message });
  }
  function checkImport(node, specifier, typeOnly) {
    if (typeof specifier !== 'string') {
      report(node, 'layer-import', 'Dynamic imports require a literal target');
      return;
    }
    const moduleIssue = checkModuleImport(file, specifier);
    if (moduleIssue) report(node, moduleIssue.rule, moduleIssue.message);
    if (isTest || !file.startsWith('src/')) return;
    const target = resolveProjectImport(file, specifier);
    if (!target) {
      const externalAllowed =
        file.startsWith('src/ui/') || file === 'src/main.tsx'
          ? ['react', 'react-dom', 'fflate'].some(
              (name) => specifier === name || specifier.startsWith(`${name}/`),
            )
          : file.startsWith('src/storage/') && ['zod', 'fflate'].includes(specifier);
      if (!externalAllowed)
        report(node, 'external-import', `External import ${specifier} is not allowed here`);
      return;
    }
    if (target.startsWith('tests/') || /\.test\./u.test(target)) {
      report(node, 'test-import', 'Production cannot import tests');
      return;
    }
    const specifiers = node.specifiers;
    const names =
      node.type === 'TSImportType' && node.qualifier?.type === 'Identifier'
        ? [node.qualifier.name]
        : specifiers?.length && specifiers.every((item) => item.type !== 'ImportNamespaceSpecifier')
          ? specifiers.map((item) => propertyName(item.imported ?? item.local))
          : undefined;
    for (const owner of resolvePublicExports(target, { names, typeOnly, loadSource })) {
      if (!allowedEdge(file, owner.target, owner.typeOnly)) {
        report(node, 'layer-import', `Forbidden edge to ${owner.target} through ${specifier}`);
      }
    }
  }
  walk(ast, (node, parent) => {
    if (file.endsWith('/index.ts') && node.type === 'ExportAllDeclaration') {
      report(node, 'public-api', 'Public indexes use explicit named exports, not export *');
    }
    if (
      ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) &&
      node.source
    ) {
      const typeOnly =
        node.importKind === 'type' ||
        node.exportKind === 'type' ||
        (node.specifiers?.length > 0 &&
          node.specifiers.every(
            (item) => item.importKind === 'type' || item.exportKind === 'type',
          ));
      checkImport(node, node.source.value, typeOnly);
    }
    if (node.type === 'CallExpression' && node.callee.type === 'Import') {
      checkImport(node, node.arguments[0]?.value, false);
    }
    if (node.type === 'ImportExpression') {
      checkImport(node, node.source?.value, false);
    }
    if (node.type === 'TSImportType') {
      // Babel 8 renamed argument to source; accept both AST versions.
      checkImport(node, (node.source ?? node.argument)?.value, true);
    }
    const name = origin(node).replace(/^globalThis\./u, '');
    const isReference =
      node.type === 'Identifier' &&
      !(
        (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
        ((parent?.type === 'ObjectProperty' || parent?.type === 'ObjectMethod') &&
          parent.key === node &&
          !parent.computed) ||
        parent?.type.startsWith('TS')
      );
    if (
      isPure &&
      ((isReference &&
        (IO_NAMES.has(name.split('.')[0]) ||
          [
            'Date.now',
            'Math.random',
            'performance.now',
            'crypto.getRandomValues',
            'crypto.randomUUID',
          ].includes(name))) ||
        (['MemberExpression', 'OptionalMemberExpression'].includes(node.type) &&
          (IO_NAMES.has(name.split('.')[0]) ||
            [
              'Date.now',
              'Math.random',
              'performance.now',
              'crypto.getRandomValues',
              'crypto.randomUUID',
            ].includes(name))))
    ) {
      report(node, 'purity', `Non-deterministic or I/O API ${name}`);
    }
    if (
      isPure &&
      node.type === 'NewExpression' &&
      origin(node.callee).replace(/^globalThis\./u, '') === 'Date' &&
      node.arguments.length === 0
    ) {
      report(node, 'purity', 'Current-time Date is forbidden');
    }
    if (
      file === 'src/domain/project/create-entity-id.ts' &&
      node.type === 'CallExpression' &&
      ['Number', 'parseInt', 'Number.parseInt'].includes(origin(node.callee))
    ) {
      report(node, 'lossy-id', 'ID suffix arithmetic must preserve decimal precision');
    }
    if (
      !isTest &&
      file.startsWith('src/') &&
      node.type === 'CallExpression' &&
      ((['Math.min', 'Math.max', 'Math.min.call', 'Math.max.call'].includes(
        origin(node.callee).replace(/^globalThis\./u, ''),
      ) &&
        node.arguments.some((argument) => argument.type === 'SpreadElement')) ||
        ['Math.min.apply', 'Math.max.apply'].includes(
          origin(node.callee).replace(/^globalThis\./u, ''),
        ))
    ) {
      report(node, 'argument-spread', 'Do not spread unbounded arrays into min/max');
    }
    if (
      isTest &&
      node.type === 'CallExpression' &&
      /^(vi|vitest)\.(mock|doMock)$/u.test(origin(node.callee)) &&
      ['react', 'react-dom'].includes(node.arguments[0]?.value)
    ) {
      report(node, 'react-mock', 'React and its hooks must run normally');
    }
    if (
      isTest &&
      node.type === 'CallExpression' &&
      /^(vi|vitest)\.spyOn$/u.test(origin(node.callee)) &&
      /^(useState|useRef|useMemo|useEffect|useCallback)$/u.test(node.arguments[1]?.value ?? '')
    ) {
      report(node, 'react-mock', 'Do not replace React hooks');
    }
    if (
      isTest &&
      node.type === 'MemberExpression' &&
      ['skip', 'only'].includes(propertyName(node.property)) &&
      /^(it|test|describe)(\.|$)/u.test(origin(node.object))
    ) {
      report(node, 'focused-test', 'Focused or skipped tests cannot enter the suite');
    }
  });
  return issues;
}

export function sourceFiles(directory = 'src') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? sourceFiles(file) : /\.[jt]sx?$/u.test(file) ? [file] : [];
  });
}

export function checkUiFolderLayout(files) {
  const groups = new Map();
  const issues = [];
  for (const file of files) {
    if (!file.startsWith('src/ui/') || file.endsWith('/index.ts')) continue;
    const directory = path.posix.dirname(file);
    const extension = path.posix.extname(file);
    const group = path.posix.basename(directory);
    if (
      (group === 'logic' && extension === '.tsx') ||
      (group === 'components' && extension === '.ts')
    ) {
      issues.push({
        file,
        line: 1,
        rule: 'ui-folder-layout',
        message: 'UI logic/ contains .ts; components/ contains .tsx (index.ts is exempt)',
      });
    }
    const extensions = groups.get(directory) ?? new Set();
    extensions.add(extension);
    groups.set(directory, extensions);
  }
  for (const [file, extensions] of groups) {
    if (extensions.has('.ts') && extensions.has('.tsx')) {
      issues.push({
        file,
        line: 1,
        rule: 'ui-folder-layout',
        message: 'Split mixed UI implementation files into logic/ and components/',
      });
    }
  }
  return issues;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const files = sourceFiles();
  const issues = [
    ...checkUiFolderLayout(files),
    ...[...files, ...sourceFiles('tests/unit')].flatMap((file) =>
      checkSource(file, readFileSync(file, 'utf8')),
    ),
  ];
  for (const issue of issues) {
    process.stderr.write(`${issue.file}:${issue.line} ${issue.rule}: ${issue.message}\n`);
  }
  process.exitCode = issues.length === 0 ? 0 : 1;
}
