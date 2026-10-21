import { useState } from 'react';
import type { Project } from '@domain';
import { KEYCAP_SIZES } from '@catalog/keycaps';
import { setKeycapSize } from '@domain/keys';
import { useProject } from '@ui/project/logic';

type SizeSession = { readonly base: Project; readonly keyIds: readonly string[] };
type KeycapSizeOptions = {
  readonly selectedKeyIds: readonly string[];
  readonly onSelectionChange: (keyIds: readonly string[]) => void;
};

export function useKeycapSize({ selectedKeyIds, onSelectionChange }: KeycapSizeOptions) {
  const { project, commit, announce } = useProject();
  const [session, setSession] = useState<SizeSession | undefined>();
  function handleOpen(keyId: string) {
    const keyIds = selectedKeyIds.includes(keyId) ? selectedKeyIds : [keyId];
    onSelectionChange(keyIds);
    setSession({ base: project, keyIds });
  }
  function handleClose() {
    setSession(undefined);
  }
  function handleChoose(sizeId: string) {
    if (session === undefined || session.base !== project) {
      return;
    }
    const next = setKeycapSize(project, { keyIds: session.keyIds, sizeId, sizes: KEYCAP_SIZES });
    if (next !== project) {
      commit((current) => (current === session.base ? next : current));
      announce(
        `Keycap size changed for ${session.keyIds.length} ${session.keyIds.length === 1 ? 'key' : 'keys'}`,
      );
    }
    handleClose();
  }
  return {
    handleOpen,
    dialogProps: {
      isOpen: session?.base === project,
      project,
      keyIds: session?.keyIds ?? [],
      onClose: handleClose,
      onChoose: handleChoose,
    },
  };
}
