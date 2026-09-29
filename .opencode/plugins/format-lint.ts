import type { Plugin, PluginInput } from '@opencode-ai/plugin';

type Shell = PluginInput['$'];
type AppClient = PluginInput['client'];

const TS_FILE = /\.tsx?$/u;

function pickTsPath(args: unknown): string | undefined {
  if (typeof args !== 'object' || args === null) {
    return undefined;
  }
  if ('filePath' in args && typeof args.filePath === 'string' && TS_FILE.test(args.filePath)) {
    return args.filePath;
  }
  if ('file' in args && typeof args.file === 'string' && TS_FILE.test(args.file)) {
    return args.file;
  }
  if ('path' in args && typeof args.path === 'string' && TS_FILE.test(args.path)) {
    return args.path;
  }
  return undefined;
}

async function isRunnable(shell: Shell, directory: string, bin: string): Promise<boolean> {
  const result = await shell`node_modules/.bin/${bin} --version`.cwd(directory).nothrow().quiet();
  return result.exitCode === 0;
}

async function logWarn(client: AppClient, message: string, file: string): Promise<void> {
  await client.app.log({
    body: { service: 'format-lint', level: 'warn', message, extra: { file } },
  });
}

export const FormatLintPlugin: Plugin = async ({ $, directory, client }) => {
  const canFormat = await isRunnable($, directory, 'oxfmt');
  const canLint = await isRunnable($, directory, 'oxlint');
  await client.app.log({
    body: {
      service: 'format-lint',
      level: 'info',
      message: `initialized (oxfmt: ${canFormat ? 'on' : 'off'}, oxlint: ${canLint ? 'on' : 'off'}; make check stays the gate)`,
      extra: {},
    },
  });
  return {
    'tool.execute.after': async (input) => {
      if (input.tool !== 'edit' && input.tool !== 'write') {
        return;
      }
      const filePath = pickTsPath(input.args);
      if (filePath === undefined) {
        return;
      }
      if (canFormat) {
        const formatted = await $`node_modules/.bin/oxfmt ${filePath}`
          .cwd(directory)
          .nothrow()
          .quiet();
        if (formatted.exitCode !== 0) {
          await logWarn(client, `oxfmt failed for ${filePath}; run make check`, filePath);
        }
      }
      if (!canLint) {
        return;
      }
      const linted = await $`node_modules/.bin/oxlint ${filePath}`.cwd(directory).nothrow().quiet();
      if (linted.exitCode !== 0) {
        const details = `${String(linted.stdout)}${String(linted.stderr)}`;
        throw new Error(`oxlint failed for ${filePath}:\n${details}`);
      }
    },
  };
};
