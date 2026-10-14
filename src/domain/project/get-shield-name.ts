import { toShieldName } from './to-shield-name';
import type { Project } from '@domain';

export function getShieldName(project: Project): string {
  return project.shieldName ?? toShieldName(project.name);
}
