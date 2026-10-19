import { renderFirmwareConf } from './render-firmware-conf';
import { getShieldName } from '@domain/project';
import type { Project } from '@domain';
import type { GeneratedFile } from './generated-file';

export function generateConf(project: Project): GeneratedFile {
  const shieldName = getShieldName(project);
  return {
    path: `boards/shields/${shieldName}/${shieldName}.conf`,
    content: renderFirmwareConf(project),
  };
}
