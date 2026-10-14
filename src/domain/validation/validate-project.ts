import { toShieldName } from '@domain/project';
import { validateBindings } from './validate-bindings';
import type { BindingsCatalog } from './validate-bindings';
import { validateLayers } from './validate-layers';
import { validateSchematic } from './validate-schematic';
import type { Project, ValidationIssue } from '@domain';

const SHIELD_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/u;

function validateShieldName(project: Project): readonly ValidationIssue[] {
  if (project.shieldName === undefined) {
    return toShieldName(project.name) === ''
      ? [
          {
            code: 'shield-name-empty',
            message:
              'The keyboard name has no letters or digits usable in file names. Use at least one Latin letter or digit, or set a technical name.',
            path: ['name'],
          },
        ]
      : [];
  }
  return SHIELD_NAME_PATTERN.test(project.shieldName)
    ? []
    : [
        {
          code: 'shield-name-invalid',
          message:
            'The technical name may use only lowercase letters, digits and _, and must not start with a digit.',
          path: ['shieldName'],
        },
      ];
}

function validateKeyboardName(
  project: Project,
  maxKeyboardNameBytes: number,
): readonly ValidationIssue[] {
  const byteCount = new TextEncoder().encode(project.name).length;
  if (byteCount <= maxKeyboardNameBytes) {
    return [];
  }
  return [
    {
      code: 'keyboard-name-too-long',
      message: `The keyboard name is ${byteCount} bytes; keyboards can announce at most ${maxKeyboardNameBytes}. Shorten it (non-Latin letters count as 2–3).`,
      path: ['name'],
    },
  ];
}

export function validateProject(
  project: Project,
  catalog: BindingsCatalog,
  schematicIssues: readonly ValidationIssue[] = validateSchematic(project),
): readonly ValidationIssue[] {
  return [
    ...validateShieldName(project),
    ...validateKeyboardName(project, catalog.shieldLimits.keyboardNameBytes),
    ...schematicIssues,
    ...validateLayers(project, catalog),
    ...validateBindings(project, catalog),
  ];
}
