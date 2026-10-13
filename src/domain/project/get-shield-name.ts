import { toShieldName } from './to-shield-name';
import type { Project } from '../types';

export function getShieldName(project: Project): string {
  return project.shieldName ?? toShieldName(project.name);
}
