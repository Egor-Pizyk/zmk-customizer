import { createProject } from '@domain/project';
import { parseProjectFile, serializeProject } from '@storage/project';
import { expect, it } from 'vitest';

it.each([1, 2] as const)('round-trips both polarities at pin %s', (pin) => {
  for (const cathode of ['toward-switch', 'away-switch'] as const) {
    const project = {
      ...createProject({ controllerId: 'nice_nano_v2' }),
      keys: [{ id: 'k1', xU: 0, yU: 0, diode: { pin, cathode } }],
    };
    expect(parseProjectFile(serializedText(project))).toEqual({ ok: true, value: project });
  }
});
it('loads v3 without adding diodes or changing the circuit', () => {
  const { controllerId: _controllerId, ...legacy } = createProject({
    controllerId: 'nice_nano_v2',
  });
  const old = { ...legacy, schemaVersion: 3, keys: [{ id: 'k1', xU: 0, yU: 0 }] };
  expect(parseProjectFile(JSON.stringify(old))).toEqual({
    ok: true,
    value: { ...old, schemaVersion: 7, controllerId: 'nice_nano_v2' },
  });
});
it.each([
  null,
  { pin: 3, cathode: 'away-switch' },
  { pin: 1 },
  { pin: 1, cathode: 'up' },
  { pin: 1, cathode: 'away-switch', extra: true },
])('rejects malformed diode %j at its key path', (diode) => {
  const paths = issuePaths(
    JSON.stringify({
      ...createProject({ controllerId: 'nice_nano_v2' }),
      schemaVersion: 7,
      controllerId: 'nice_nano_v2',
      keys: [{ id: 'k1', xU: 0, yU: 0, diode }],
    }),
  );
  expect(paths.some((path) => path.startsWith('keys.0.diode'))).toBe(true);
});

function serializedText(project: Parameters<typeof serializeProject>[0]) {
  const result = serializeProject(project);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}
function issuePaths(raw: string) {
  const result = parseProjectFile(raw);
  if (result.ok || result.error.kind !== 'not-project') {
    throw new Error('Expected field errors');
  }
  return result.error.issues.map((issue) => issue.path);
}
