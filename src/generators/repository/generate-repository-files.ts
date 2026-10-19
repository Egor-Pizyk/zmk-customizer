import { FIRMWARE_OPTIONS } from '@catalog/firmware';
import { getControllerBoard } from '@catalog/controllers';
import { getFirmwareDefault } from '@domain/firmware';
import { renderFirmwareConf } from '@generators';
import type { ShieldMatrix } from '@domain/wiring/matrix';
import type { Project } from '@domain';
import { getShieldName } from '@domain/project';
import type { GeneratedFile } from '@generators';
import { generateShieldFiles } from '@generators/shield';

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
  const files = generateShieldFiles(project, options.matrix, options.target).flatMap((file) =>
    toRepositoryFile(project, file),
  );
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

function toRepositoryFile(project: Project, file: GeneratedFile): GeneratedFile[] {
  const name = getShieldName(project);
  const board = getControllerBoard(project.controllerId);
  const needsHalfConfigs =
    project.wiring?.topology === 'split' &&
    FIRMWARE_OPTIONS.some(
      (option) =>
        'centralOnly' in option &&
        project.firmware[option.id] !== undefined &&
        project.firmware[option.id] !== getFirmwareDefault(project, { option, board }),
    );
  if (file.path.endsWith('.conf') && needsHalfConfigs) {
    return [
      {
        path: `config/${name}_left.conf`,
        content: renderFirmwareConf(project, { half: 'central' }),
      },
      {
        path: `config/${name}_right.conf`,
        content: renderFirmwareConf(project, { half: 'peripheral' }),
      },
    ];
  }
  if (file.path.endsWith('.conf')) {
    return [{ ...file, path: `config/${name}.conf` }];
  }
  if (file.path.endsWith('.keymap')) {
    return [file, { ...file, path: `config/${name}.keymap` }];
  }
  return [file];
}
