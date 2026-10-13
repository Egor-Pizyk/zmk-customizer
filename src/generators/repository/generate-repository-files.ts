import type { ShieldMatrix, Project } from '@domain';
import { getShieldName } from '@domain';
import type { GeneratedFile } from '../generated-file';
import { generateShieldFiles } from '../shield/generate-shield-files';

type RepositoryOptions = {
  readonly matrix: ShieldMatrix;
  readonly target: {
    readonly boardId: string;
    readonly connector: 'pro_micro' | 'xiao_d';
    readonly revision: string;
    readonly workflowPath: string;
  };
  readonly includeWorkflow: boolean;
};

export function generateRepositoryFiles(
  project: Project,
  options: RepositoryOptions,
): readonly GeneratedFile[] {
  const name = getShieldName(project);
  const files = generateShieldFiles(project, options.matrix, options.target).flatMap((file) => {
    if (file.path.endsWith('.conf')) {
      return [{ ...file, path: `config/${name}.conf` }];
    }
    if (file.path.endsWith('.keymap')) {
      return [file, { ...file, path: `config/${name}.keymap` }];
    }
    return [file];
  });
  files.push(
    { path: 'zephyr/module.yml', content: 'build:\n  settings:\n    board_root: .\n' },
    { path: 'config/west.yml', content: renderManifest(options.target.revision) },
    {
      path: 'build.yaml',
      content: `include:\n${(project.wiring?.topology === 'split' ? [`${name}_left`, `${name}_right`] : [name]).map((shield) => `  - board: ${options.target.boardId}\n    shield: ${shield}\n`).join('')}`,
    },
  );
  if (options.includeWorkflow) {
    files.push({ path: '.github/workflows/build.yml', content: renderWorkflow(options.target) });
  }
  return files.toSorted((left, right) => (left.path < right.path ? -1 : 1));
}

function renderManifest(revision: string): string {
  return `manifest:
  defaults:
    revision: ${revision}
  remotes:
    - name: zmkfirmware
      url-base: https://github.com/zmkfirmware
  projects:
    - name: zmk
      remote: zmkfirmware
      import: app/west.yml
  self:
    path: config
`;
}

function renderWorkflow(target: RepositoryOptions['target']): string {
  return `name: Build ZMK firmware
on: [push, pull_request, workflow_dispatch]

jobs:
  build:
    uses: ${target.workflowPath}@${target.revision}
`;
}
