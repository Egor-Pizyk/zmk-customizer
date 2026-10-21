import { useRef, useState } from 'react';
import { buildAgentPackage } from '@storage/agent';
import { buildExportZip } from '@storage/export';
import { downloadBlob } from '@ui/downloads';

export function useAgentPackageDownload(announce: (text: string) => void) {
  const session = useRef(0);
  const isLocked = useRef(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [message, setMessage] = useState<string>();

  function cancelDownload() {
    session.current += 1;
    isLocked.current = false;
    setIsBuilding(false);
    setMessage(undefined);
  }

  async function handleDownload() {
    if (isLocked.current) {
      return;
    }
    isLocked.current = true;
    const token = ++session.current;
    setIsBuilding(true);
    setMessage(undefined);
    const text = await prepareDownload(() => session.current === token);
    if (text === undefined) {
      return;
    }
    isLocked.current = false;
    setIsBuilding(false);
    setMessage(text);
    announce(text);
  }

  return { isBuilding, message, handleDownload, cancelDownload };
}

function startDownload(bytes: Uint8Array<ArrayBuffer>) {
  const result = downloadBlob({
    fileName: 'zmk-customizer-agent-v1.zip',
    blob: new Blob([bytes], { type: 'application/zip' }),
  });
  return result.ok
    ? 'Agent package download started. Give the extracted files to your agent.'
    : 'Could not download the agent package. Allow downloads in your browser and try again.';
}

async function prepareDownload(isCurrent: () => boolean): Promise<string | undefined> {
  try {
    const bytes = await buildExportZip(buildAgentPackage());
    return isCurrent() ? startDownload(bytes) : undefined;
  } catch {
    return isCurrent() ? 'Could not build the agent package. Try downloading it again.' : undefined;
  }
}
