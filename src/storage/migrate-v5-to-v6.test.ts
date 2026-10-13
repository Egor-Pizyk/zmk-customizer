import { getDefinedValue } from '../../tests/helpers/defined-value';
import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { getResultValue } from '../../tests/helpers/result';
import { getKeyGeometry } from '../domain/get-key-geometry';
import { parseProjectFile } from './parse-project-file';
import { migrateV5ToV6 } from './migrate-v5-to-v6';
import { projectSchema } from './project-schema';

it('loads a v5 project with unchanged keys, bindings, wiring and default old geometry', () => {
  const old = {
    ...buildProject({
      keys: [
        { id: 'k9007199254740993', xU: -2, yU: 3, diode: { pin: 2, cathode: 'toward-switch' } },
      ],
      bindings: { k9007199254740993: { kind: 'trans' } },
    }),
    schemaVersion: 5,
  };
  const loaded = getResultValue(parseProjectFile(JSON.stringify(old)));
  expect(loaded).toEqual({ ...old, schemaVersion: 6 });
  expect(getKeyGeometry(getDefinedValue(loaded.keys[0]))).toMatchObject({
    widthU: 1,
    heightU: 1,
    rotationDeg: 0,
  });
  expect(getResultValue(parseProjectFile(JSON.stringify(loaded)))).toEqual(loaded);
});
it('refuses new geometry inside legacy keys rather than silently accepting it', () => {
  const old = {
    ...buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0, widthU: 2 }] }),
    schemaVersion: 5,
  };
  expect(parseProjectFile(JSON.stringify(old)).ok).toBe(false);
  expect(migrateV5ToV6(null)).toBeNull();
});
it('round-trips all geometry while rejecting non-finite fields and allowing repairable finite values', () => {
  const project = {
    ...buildProject({
      keys: [
        {
          id: 'k0',
          xU: -2,
          yU: 3,
          widthU: 2.25,
          heightU: 1.5,
          rotationDeg: -30,
          rotationOriginXU: 1,
          rotationOriginYU: 2,
        },
      ],
    }),
    schemaVersion: 6,
  };
  expect(getResultValue(parseProjectFile(JSON.stringify(project)))).toEqual(project);
  for (const field of [
    'widthU',
    'heightU',
    'rotationDeg',
    'rotationOriginXU',
    'rotationOriginYU',
  ]) {
    expect(
      projectSchema.safeParse({ ...project, keys: [{ ...project.keys[0], [field]: Infinity }] })
        .success,
    ).toBe(false);
  }
  expect(
    parseProjectFile(JSON.stringify({ ...project, keys: [{ ...project.keys[0], widthU: -1 }] })).ok,
  ).toBe(true);
});
