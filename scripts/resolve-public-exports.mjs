import { parse } from '@babel/parser';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT, resolveProjectImport } from './module-imports.mjs';

const astCache = new Map();
function readSource(file) {
  const absolute = path.join(PROJECT_ROOT, file);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined;
}
function nodeName(node) {
  return node?.type === 'Identifier' ? node.name : node?.value;
}
function parseExports(file, source) {
  const cached = astCache.get(file);
  if (cached?.source === source) return cached.ast;
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  astCache.set(file, { source, ast });
  return ast;
}

export function resolvePublicExports(
  target,
  { names, typeOnly, loadSource = readSource, visited = new Set() },
) {
  const key = `${target}:${names?.join(',') ?? '*'}:${typeOnly}`;
  const fallback = [{ target, typeOnly }];
  if (visited.has(key) || !/\.tsx?$/u.test(target)) return fallback;
  const source = loadSource(target);
  if (source === undefined) return fallback;
  const ast = parseExports(target, source);
  const nextVisited = new Set([...visited, key]);
  const imports = new Map();
  for (const statement of ast.program.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    for (const specifier of statement.specifiers) {
      imports.set(specifier.local.name, {
        target: resolveProjectImport(target, statement.source.value),
        names:
          specifier.type === 'ImportNamespaceSpecifier'
            ? undefined
            : [nodeName(specifier.imported)],
        typeOnly: statement.importKind === 'type' || specifier.importKind === 'type',
      });
    }
  }
  function follow(origin, selected, typed) {
    return resolvePublicExports(origin, {
      names: selected,
      typeOnly: typed,
      loadSource,
      visited: nextVisited,
    });
  }
  const origins = ast.program.body.flatMap((statement) => {
    if (statement.type !== 'ExportNamedDeclaration') return [];
    const typed = typeOnly || statement.exportKind === 'type';
    if (statement.declaration) {
      const declaration = statement.declaration;
      const declaredNames =
        declaration.type === 'VariableDeclaration'
          ? declaration.declarations.map((item) => nodeName(item.id))
          : [nodeName(declaration.id)];
      return !names || declaredNames.some((name) => names.includes(name))
        ? [{ target, typeOnly: typed }]
        : [];
    }
    return statement.specifiers.flatMap((specifier) => {
      if (names && !names.includes(nodeName(specifier.exported))) return [];
      const localName = nodeName(specifier.local);
      const exportType = typed || specifier.exportKind === 'type';
      if (statement.source) {
        const origin = resolveProjectImport(target, statement.source.value);
        return origin ? follow(origin, [localName], exportType) : fallback;
      }
      const imported = imports.get(localName);
      return imported?.target
        ? follow(imported.target, imported.names, exportType || imported.typeOnly)
        : fallback;
    });
  });
  return origins.length ? origins : fallback;
}
