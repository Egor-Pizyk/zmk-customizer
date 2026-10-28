import type { Half, Project, WireEnd, WirePoint } from '@domain';

type EndMeaning =
  | Exclude<WireEnd, { readonly kind: 'junction' }>
  | Omit<Extract<WireEnd, { readonly kind: 'junction' }>, 'at'>;
export type ElectricalRelations = {
  readonly controllerId: string;
  readonly wiring: Project['wiring'];
  readonly keys: readonly {
    readonly id: string;
    readonly half: Half;
    readonly diode: Project['keys'][number]['diode'];
  }[];
  readonly encoderPins: readonly {
    readonly id: string;
    readonly half: Half;
    readonly wiringMode: Project['encoders'][number]['wiringMode'];
    readonly aPin: number | undefined;
    readonly bPin: number | undefined;
    readonly pushKeyId: string | undefined;
  }[];
  readonly wires: readonly {
    readonly id: string;
    readonly half: Half;
    readonly start: EndMeaning;
    readonly end: EndMeaning;
  }[];
  readonly conductors: readonly {
    readonly wireId: string;
    readonly id: string;
    readonly sites: readonly (readonly string[])[];
  }[];
  readonly nets: readonly (readonly string[])[];
};

export type RelationSite = {
  readonly arc: number;
  readonly label: string;
  readonly at?: WirePoint;
};
export type RelationPath = {
  readonly wireId: string;
  readonly id: string;
  readonly order: number;
  readonly points: readonly WirePoint[];
  readonly length: number;
  readonly sites: RelationSite[];
};
export type RelationLocation = { readonly path: RelationPath; readonly arc: number };

export type ElectricalRoutingPath = {
  readonly wireId: string;
  readonly id: string;
  readonly points: readonly WirePoint[];
  readonly sites: readonly { readonly at: WirePoint; readonly labels: readonly string[] }[];
};
