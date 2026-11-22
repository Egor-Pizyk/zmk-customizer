import type { Half, WirePoint } from '@domain';

export type RoutingSegment = {
  readonly id: string;
  readonly half: Half;
  readonly netId: string;
  readonly from: WirePoint;
  readonly to: WirePoint;
};
export type SymmetricRouteInput = {
  readonly points: readonly WirePoint[];
  readonly half: Half;
  readonly netId: string;
  readonly outward: 'left' | 'right' | 'up' | 'down';
  readonly clearanceU: number;
  readonly offsetU: number;
  readonly obstacles: readonly RoutingSegment[];
  readonly forbiddenPoints?: readonly WirePoint[];
  readonly pinClearanceU?: number;
};
export type RouteSearchFailure = {
  readonly code: 'route-impossible' | 'route-invalid';
  readonly message: string;
  readonly attempts: {
    readonly preferred: number;
    readonly outward: number;
    readonly detour: number;
  };
  readonly blockingIds: readonly string[];
};
export type SymmetricRoute = {
  readonly points: readonly WirePoint[];
  readonly strategy: 'preferred' | 'outward' | 'detour';
  /** Foreign perpendicular crossings must be materialized as insulation before committing a Wire. */
  readonly insulatedCrossings: readonly { readonly segmentId: string; readonly at: WirePoint }[];
};
