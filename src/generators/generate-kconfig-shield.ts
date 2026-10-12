import { getShieldName } from '../domain/get-shield-name';
import type { Project } from '../domain/types';
import type { GeneratedFile } from './generated-file';

export function generateKconfigShield(project: Project): GeneratedFile {
  const shieldName = getShieldName(project);
  return {
    path: `boards/shields/${shieldName}/Kconfig.shield`,
    content: `config SHIELD_${shieldName.toUpperCase()}\n    def_bool $(shields_list_contains,${shieldName})\n`,
  };
}
