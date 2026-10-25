import { useRef, useState } from 'react';
import type { GeneratedFile } from '@generators';
import { buildExportZip } from '@storage/export';
import { downloadBlob, downloadTextFile } from '@ui/downloads';

type ExportActionsInput = {
  readonly files: readonly GeneratedFile[];
  readonly shieldName: string;
  readonly isBlocked: boolean;
  readonly onZipStarted?: () => void;
  readonly announce: (text: string) => void;
};
type ZipControl = {
  readonly lock: { current: boolean };
  readonly setIsBuildingZip: (value: boolean) => void;
  readonly report: (text: string) => void;
};

export function useExportActions(input: ExportActionsInput) {
  const lock = useRef(false);
  const [isBuildingZip, setIsBuildingZip] = useState(false);
  const [feedback, setFeedback] = useState('');
  function report(text: string) {
    setFeedback(text);
    input.announce(text);
  }
  async function handleZipDownload() {
    await downloadZip(input, { lock, setIsBuildingZip, report });
  }
  async function handleFileCopy(file: GeneratedFile) {
    if (!input.isBlocked) {
      await copyFile(file, report);
    }
  }
  function handleFileDownload(file: GeneratedFile) {
    if (!input.isBlocked) {
      downloadFile(file, report);
    }
  }
  return { isBuildingZip, feedback, handleZipDownload, handleFileCopy, handleFileDownload };
}

async function downloadZip(input: ExportActionsInput, control: ZipControl) {
  const { lock } = control;
  if (input.isBlocked || lock.current) {
    return;
  }
  lock.current = true;
  control.setIsBuildingZip(true);
  control.report('Building zip…');
  const fileName = `${input.shieldName}-zmk-config.zip`;
  try {
    const bytes = await buildExportZip(input.files);
    const result = downloadBlob({ fileName, blob: new Blob([bytes], { type: 'application/zip' }) });
    if (result.ok) {
      input.onZipStarted?.();
    }
    control.report(
      result.ok
        ? `Download started: ${fileName}.`
        : 'Your browser blocked the download. Allow downloads and try again.',
    );
  } catch {
    control.report('Could not build the ZIP. Try downloading again.');
  } finally {
    lock.current = false;
    control.setIsBuildingZip(false);
  }
}

async function copyFile(file: GeneratedFile, report: (text: string) => void) {
  try {
    await navigator.clipboard.writeText(file.content);
    report(`Copied ${file.path}.`);
  } catch {
    report(
      'Could not copy the file. Select the preview text and copy it manually, or allow clipboard access and try again.',
    );
  }
}

function downloadFile(file: GeneratedFile, report: (text: string) => void) {
  const fileName = file.path.split('/').at(-1) ?? file.path;
  const result = downloadTextFile({
    fileName,
    text: file.content,
    mimeType: 'text/plain;charset=utf-8',
  });
  report(
    result.ok
      ? `Download started: ${fileName}.`
      : 'Your browser blocked the download. Allow downloads and try again.',
  );
}
