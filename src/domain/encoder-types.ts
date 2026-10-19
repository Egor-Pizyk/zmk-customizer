import type { Binding, Half } from './types';

export type Encoder = {
  readonly id: string;
  readonly xU: number;
  readonly yU: number;
  readonly half: Half;
  readonly aPin?: number;
  readonly bPin?: number;
  readonly steps: number;
  readonly triggersPerRotation: number;
};
export type EncoderBinding = {
  readonly clockwise: Binding;
  readonly counterclockwise: Binding;
};
