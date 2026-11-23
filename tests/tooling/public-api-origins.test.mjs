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

for (const code of [
  "export { dia } from '@joint/core';",
  "export * from '@joint/core';",
  "import { dia } from '@joint/core'; export { dia };",
  "import { dia as core } from '@joint/core'; const bridge = core; export { bridge };",
  "import { dia } from '@joint/core'; export const Graph = dia.Graph;",
]) {
  test(`JointJS runtime cannot escape its adapter: ${code}`, () => {
    assert.ok(
      checkSource('src/ui/schematic/diagram/logic/index.ts', code).some(
        (issue) => issue.rule === 'diagram-public-api',
      ),
    );
  });
}
