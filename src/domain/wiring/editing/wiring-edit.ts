import type { ControllerBoard, Half, Wiring } from '@domain';
import type { WiringRegenerationInput } from './regeneration-types';

export type WiringEdit = { readonly board: ControllerBoard } & (
  | { readonly kind: 'initialize' }
  | {
      readonly kind: 'regenerate';
      readonly gridStepU?: number;
      readonly input: Omit<WiringRegenerationInput, 'board'>;
    }
  | { readonly kind: 'complete'; readonly gridStepU: number }
  | { readonly kind: 'auto'; readonly gridStepU: number }
  | { readonly kind: 'mode'; readonly mode: 'matrix' | 'direct' }
  | { readonly kind: 'topology'; readonly topology: 'unibody' | 'split' }
  | { readonly kind: 'direction'; readonly direction: Wiring['diodeDirection'] }
  | { readonly kind: 'pin'; readonly terminalId: string; readonly boardPin: number | undefined }
  | {
      readonly kind: 'cell';
      readonly keyId: string;
      readonly row: number;
      readonly col: number;
      readonly half: Half;
    }
  | {
      readonly kind: 'dimensions';
      readonly half: Half;
      readonly rows: number;
      readonly cols: number;
    }
);
