import { getShieldName } from '../domain/get-shield-name';
import type { Project } from '../domain/types';
import { escapeString } from './escape-string';
import type { GeneratedFile } from './generated-file';

export function generateKconfigDefconfig(project: Project): GeneratedFile {
  const shieldName = getShieldName(project);
  return {
    path: `boards/shields/${shieldName}/Kconfig.defconfig`,
    content: `if SHIELD_${shieldName.toUpperCase()}\n\nconfig ZMK_KEYBOARD_NAME\n    default "${escapeString(project.name, 'kconfig')}"\n\nendif\n`,
  };
}
