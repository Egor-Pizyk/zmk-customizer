import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkSource } from '../../scripts/check-architecture.mjs';

for (const bridge of [
  "export { getNets as inspect } from '@domain/wires/nets';",
  "import { getNets } from '@domain/wires/nets'; export { getNets as inspect };",
]) {
  test(`public aliases retain low-level ownership through ${bridge}`, () => {
    const sources = new Map([
      [
        'src/domain/index.ts',
        "export { inspect } from './public-bridge.ts'; export { getNets } from '@domain/wires/nets';",
      ],
      ['src/domain/public-bridge.ts', bridge],
      ['src/domain/wires/nets/index.ts', "export { getNets } from './get-nets.ts';"],
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
