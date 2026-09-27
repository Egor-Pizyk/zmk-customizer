import { IssuesToggle } from '../shell/issues-toggle';
import type { WorldPoint } from './viewport';

type StatusBarProps = {
  readonly pointer: WorldPoint | undefined;
  /** The rendered zoom, including a gesture in progress. */
  readonly zoom: number;
  readonly isSnapEnabled: boolean;
  readonly gridSizeU: number;
};

function formatU(valueU: number): string {
  return `${Number(valueU.toFixed(3))}u`;
}

export function StatusBar({ pointer, zoom, isSnapEnabled, gridSizeU }: StatusBarProps) {
  return (
    <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-border bg-surface-muted px-3 text-xs text-text-muted">
      <span>{pointer === undefined ? '—' : `${formatU(pointer.xU)}, ${formatU(pointer.yU)}`}</span>
      <span>{`${Math.round(zoom * 100)}%`}</span>
      <span>{isSnapEnabled ? 'Snap on' : 'Snap off'}</span>
      <span>{`Grid ${formatU(gridSizeU)}`}</span>
      <IssuesToggle />
    </footer>
  );
}
