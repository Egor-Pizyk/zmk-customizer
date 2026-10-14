import type { Project } from '@domain';

// `undefined` clears the override, so the technical name is derived from the name again.
export function setShieldName(
  project: Project,
  input: { readonly shieldName: string | undefined },
): Project {
  if (project.shieldName === input.shieldName) {
    return project;
  }
  const { shieldName: _cleared, ...rest } = project;
  return input.shieldName === undefined ? rest : { ...rest, shieldName: input.shieldName };
}
