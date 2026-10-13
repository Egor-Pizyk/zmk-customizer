import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkSource } from '../../scripts/check-architecture.mjs';

for (const bridge of [
  "export { getNets as inspect } from './analysis/get-nets.ts';",
  "import { getNets } from '@domain'; export { getNets as inspect };",
]) {
  test(`public aliases retain low-level ownership through ${bridge}`, () => {
    const sources = new Map([
      [
        'src/domain/index.ts',
        "export { inspect } from './public-bridge.ts'; export { getNets } from './analysis/get-nets.ts';",
      ],
      ['src/domain/public-bridge.ts', bridge],
    ]);
    const diagnostics = checkSource(
      'src/ui/schematic/probe.ts',
      "import { inspect } from '@domain';",
      {
        loadSource: (file) => sources.get(file),
      },
    );
    assert.ok(
      diagnostics.some((issue) => issue.rule === 'layer-import'),
      JSON.stringify(diagnostics),
    );
  });
}
