import { renderEncoderDefaults } from './render-encoder-defaults';
import { getShieldName } from '@domain/project';
import type { Project } from '@domain';
import { escapeString } from '@generators';
import type { GeneratedFile } from '@generators';

export function generateKconfigDefconfig(project: Project): GeneratedFile {
  const shieldName = getShieldName(project);
  return {
    path: `boards/shields/${shieldName}/Kconfig.defconfig`,
    content:
      project.wiring?.topology === 'split'
        ? `if SHIELD_${shieldName.toUpperCase()}_LEFT\n\nconfig ZMK_KEYBOARD_NAME\n    default "${escapeString(project.name, 'kconfig')}"\n\nconfig ZMK_SPLIT_ROLE_CENTRAL\n    default y\n\nendif\n\nif SHIELD_${shieldName.toUpperCase()}_LEFT || SHIELD_${shieldName.toUpperCase()}_RIGHT\n\nconfig ZMK_SPLIT\n    default y\n\n${renderEncoderDefaults(project)}endif\n`
        : `if SHIELD_${shieldName.toUpperCase()}\n\nconfig ZMK_KEYBOARD_NAME\n    default "${escapeString(project.name, 'kconfig')}"\n\n${renderEncoderDefaults(project)}endif\n`,
  };
}
