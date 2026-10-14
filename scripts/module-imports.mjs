import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(readFileSync(new URL('../tsconfig.json', import.meta.url), 'utf8'));
const modules = Object.entries(config.compilerOptions.paths)
  .map(([alias, targets]) => ({
    alias,
    entry: path.posix.normalize(targets[0]),
    root: path.posix.dirname(path.posix.normalize(targets[0])),
  }))
  .toSorted((left, right) => right.root.length - left.root.length);

export function getModule(file) {
  return modules.find((module) => file === module.entry || file.startsWith(`${module.root}/`));
}

export function resolveProjectImport(file, specifier) {
  const clean = specifier.split('?')[0].replace(/\.js$/u, '.ts');
  const alias = modules.find((module) => module.alias === clean);
  if (alias) return alias.entry;
  const prefix = modules.find((module) => clean.startsWith(`${module.alias}/`));
  if (prefix) return path.posix.join(prefix.root, clean.slice(prefix.alias.length + 1));
  let target;
  if (clean.startsWith('/src/')) target = clean.slice(1);
  else if (clean.startsWith(PROJECT_ROOT)) target = clean.slice(PROJECT_ROOT.length);
  else if (clean.startsWith('.'))
    target = path.posix.normalize(path.posix.join(path.posix.dirname(file), clean));
  else return undefined;
  const candidates = [target, `${target}.ts`, `${target}.tsx`, `${target}/index.ts`];
  return candidates.find((candidate) => existsSync(path.join(PROJECT_ROOT, candidate))) ?? target;
}

export function checkModuleImport(file, specifier) {
  const target = resolveProjectImport(file, specifier);
  if (!target?.startsWith('src/')) {
    if (/^@(domain|generators|catalog|storage|ui)(?:\/|$)/u.test(specifier)) {
      return {
        rule: 'public-api',
        message: 'Use an exact module alias from tsconfig.json; deep aliases are private',
      };
    }
    return undefined;
  }
  if (/\.(?:css|h|json|svg)(?:$|\?)/u.test(target)) return undefined;
  const owner = getModule(file);
  const imported = getModule(target);
  if (owner && imported?.root === owner.root) {
    if (target === owner.entry && file !== owner.entry) {
      return {
        rule: 'self-import',
        message: 'Module internals use relative imports, never their own index.ts',
      };
    }
    return undefined;
  }
  if (!imported || target !== imported.entry) {
    return {
      rule: 'public-api',
      message: `Import the public index.ts through ${imported?.alias ?? 'a module alias'}; implementation files are private`,
    };
  }
  if (specifier !== imported.alias) {
    return {
      rule: 'module-alias',
      message: `Use ${imported.alias} instead of a relative path to index.ts`,
    };
  }
  return undefined;
}
