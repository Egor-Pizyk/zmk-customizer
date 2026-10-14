import { getShieldName } from '@domain/project';
import type { Project } from '@domain';
import type { GeneratedFile } from '@generators';

export function generateKconfigShield(project: Project): GeneratedFile {
  const shieldName = getShieldName(project);
  return {
    path: `boards/shields/${shieldName}/Kconfig.shield`,
    content:
      project.wiring?.topology === 'split'
        ? ['left', 'right']
            .map(
              (half) =>
                `config SHIELD_${shieldName.toUpperCase()}_${half.toUpperCase()}\n    def_bool $(shields_list_contains,${shieldName}_${half})\n`,
            )
            .join('\n')
        : `config SHIELD_${shieldName.toUpperCase()}\n    def_bool $(shields_list_contains,${shieldName})\n`,
  };
}
