import path from 'node:path';
import { checkModuleImport, PROJECT_ROOT } from './module-imports.mjs';

export default {
  meta: { name: 'modules' },
  rules: {
    'public-api': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Import other project modules only through their public index.ts alias',
        },
        schema: [],
        messages: { boundary: '{{message}}' },
      },
      create(context) {
        const file = path.relative(PROJECT_ROOT, context.filename).split(path.sep).join('/');
        function check(node) {
          if (typeof node.source?.value !== 'string') return;
          const issue = checkModuleImport(file, node.source.value);
          if (issue) context.report({ node: node.source, messageId: 'boundary', data: issue });
        }
        return {
          ImportDeclaration: check,
          ExportNamedDeclaration: check,
          ExportAllDeclaration: check,
          ImportExpression: check,
          TSImportType: check,
          CallExpression(node) {
            if (node.callee.type === 'Import') {
              check({ source: node.arguments[0] });
            }
          },
        };
      },
    },
  },
};
