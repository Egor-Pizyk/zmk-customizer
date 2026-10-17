import { createServer } from 'vite';
import { performance } from 'node:perf_hooks';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { findWireContacts } = await server.ssrLoadModule('/src/domain/wires/index.ts');
  const { createProject } = await server.ssrLoadModule('/src/domain/project/index.ts');
  const analysisInput = (
    await server.ssrLoadModule('/tests/helpers/analysis-input.ts')
  ).createAnalysisInput();
  const { analyzeProject } = await server.ssrLoadModule('/src/domain/analysis/index.ts');
  const { getNets } = await server.ssrLoadModule('/src/domain/wires/nets/index.ts');
  const { validateSchematic } = await server.ssrLoadModule('/src/domain/validation/index.ts');
  const { validateShieldProject } = await server.ssrLoadModule(
    '/src/domain/validation/shield/index.ts',
  );
  if (process.argv.includes('--analysis')) {
    const { buildWiringProject } = await server.ssrLoadModule('/tests/helpers/wiring-project.ts');
    for (const kind of ['matrix', 'direct']) {
      for (const topology of ['unibody', 'split']) {
        const project = buildWiringProject(kind, topology);
        const started = performance.now();
        const analysis = analyzeProject(project, analysisInput);
        process.stdout.write(
          `${kind}/${topology}: ${Math.round(performance.now() - started)}ms (${project.keys.length} keys, ${project.wires.length} wires, ${analysis.issues.length} issues)\n`,
        );
      }
    }
  }
  for (const [wireCount, bendCount] of process.argv.includes('--analysis')
    ? [[300, 4]]
    : [
        [300, 0],
        [300, 4],
        [600, 4],
        [300, 16],
        [300, 32],
        [300, 8],
        [600, 8],
      ]) {
    const keys = Array.from({ length: 100 }, (_, index) => ({
      id: `k${index}`,
      xU: index % 10,
      yU: Math.floor(index / 10),
    }));
    const wires = Array.from({ length: wireCount }, (_, index) => ({
      id: `w${index}`,
      start: { kind: 'key-pin', keyId: `k${index % 100}`, pin: 1 },
      end: { kind: 'free', at: { xU: (index % 17) / 2, yU: (index % 23) / 2 } },
      bends: Array.from({ length: bendCount }, (unused, bend) => ({
        xU: (bend % 2) * 12 + index / 1000,
        yU: bend / 2 + index / 1000,
      })),
    }));
    const project = { ...createProject({ controllerId: 'nice_nano_v2' }), keys, wires };
    if (process.argv.includes('--analysis')) {
      for (const [mode, run] of [
        [
          'independent consumers',
          () => {
            findWireContacts(project);
            getNets(project);
            validateSchematic(project);
            return validateShieldProject(project, analysisInput);
          },
        ],
        ['shared analysis', () => analyzeProject(project, analysisInput)],
      ]) {
        const started = performance.now();
        run();
        process.stdout.write(`${mode}: ${Math.round(performance.now() - started)}ms\n`);
      }
      continue;
    }
    const samples = [];
    for (let repeat = 0; repeat < 3; repeat += 1) {
      const start = performance.now();
      const result = findWireContacts(project);
      samples.push({
        ms: Math.round(performance.now() - start),
        crossings: result.crossings.length,
      });
    }
    process.stdout.write(
      `${JSON.stringify({ keys: 100, wires: wireCount, bends: bendCount, segmentUpperBound: wireCount * (bendCount + 1) * 2, samples })}\n`,
    );
  }
} finally {
  await server.close();
}
