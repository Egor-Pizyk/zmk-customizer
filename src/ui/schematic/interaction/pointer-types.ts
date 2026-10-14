import type { Project, WirePoint } from '@domain';
import type { WireDraft } from './reduce-wire-draft';
import type { SchematicSelection, SelectionChange } from './schematic-selection';
import type { ToolId } from '@ui/schematic/tools/logic';

export type Drag =
  | {
      readonly kind: 'key';
      readonly keyId: string;
      readonly origin: WirePoint;
      readonly keyStart: WirePoint;
      readonly position: WirePoint;
    }
  | {
      readonly kind: 'multi-key';
      readonly keyIds: readonly string[];
      readonly origin: WirePoint;
      readonly keyStarts: readonly { keyId: string; start: WirePoint }[];
      readonly position: WirePoint;
    }
  | {
      readonly kind: 'bend';
      readonly wireId: string;
      readonly bendIndex: number;
      readonly point: WirePoint;
    }
  | {
      readonly kind: 'marquee';
      readonly start: WirePoint;
      readonly end: WirePoint;
    };

export type Commit = (change: (project: Project) => Project, announcementText?: string) => void;

export type SchematicPointerOptions = {
  readonly project: Project;
  readonly activeToolId: ToolId;
  /** Grid step when snapping is on. */
  readonly snapGridU: number | undefined;
  readonly commit: Commit;
  readonly selection: SchematicSelection;
  readonly onSelectionChange: SelectionChange;
  readonly onHint: (text: string) => void;
  /** A new press clears the previous hint. */
  readonly onHintClear: () => void;
};

export type PointerState = SchematicPointerOptions & {
  readonly drag: Drag | undefined;
  readonly onDragChange: (drag?: Drag) => void;
  readonly draft: WireDraft | undefined;
  readonly onDraftChange: (draft?: WireDraft) => void;
};
