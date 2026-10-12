import { getShieldName } from '../domain/get-shield-name';
import type { Project } from '../domain/types';
import type { GeneratedFile } from './generated-file';

export function generateConf(project: Project): GeneratedFile {
  const shieldName = getShieldName(project);
  return {
    path: `boards/shields/${shieldName}/${shieldName}.conf`,
    content: '# No user settings; use ZMK v0.3 defaults.\n',
  };
}
