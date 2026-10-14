import { assertNever } from '@domain';
import type { ProjectFileError } from '@storage/project';

const MAX_ISSUE_LINES = 10;

export type FormattedFileError = { readonly title: string; readonly lines: readonly string[] };

// Capped so a foreign JSON file cannot produce hundreds of lines (research R15).
export function formatProjectFileError(error: ProjectFileError): FormattedFileError {
  switch (error.kind) {
    case 'not-json': {
      return {
        title: 'This file is not a ZMK Customizer project file and could not be read.',
        lines: [],
      };
    }
    case 'newer-version': {
      return { title: 'This file was made by a newer version of ZMK Customizer.', lines: [] };
    }
    case 'too-large': {
      return { title: 'This project exceeds the 5 MiB file or saved-data limit.', lines: [] };
    }
    case 'not-project': {
      const lines = error.issues
        .slice(0, MAX_ISSUE_LINES)
        .map((issue) => `${issue.path === '' ? '(file)' : issue.path}: ${issue.message}`);
      const hiddenCount = error.issues.length - lines.length;
      const more = hiddenCount > 0 ? [`…and ${hiddenCount} more`] : [];
      return { title: 'This file is not a valid project file:', lines: [...lines, ...more] };
    }
    default: {
      return assertNever(error);
    }
  }
}
