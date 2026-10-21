// Nominal rectangular footprints, not a guarantee of profile/stabilizer compatibility.
// Sources checked 2026-10-21: https://spkeyboards.com/collections/sa-individual-keycaps
// and https://spkeyboards.com/collections/sa-individual-keycaps/products/sp-sa-spacebars
export const KEYCAP_SIZES = [
  { id: '1', label: '1 × 1 u', widthU: 1, heightU: 1 },
  { id: '1.25', label: '1.25 × 1 u', widthU: 1.25, heightU: 1 },
  { id: '1.5', label: '1.5 × 1 u', widthU: 1.5, heightU: 1 },
  { id: '1.75', label: '1.75 × 1 u', widthU: 1.75, heightU: 1 },
  { id: '2', label: '2 × 1 u', widthU: 2, heightU: 1 },
  { id: '2.25', label: '2.25 × 1 u', widthU: 2.25, heightU: 1 },
  { id: '2.75', label: '2.75 × 1 u', widthU: 2.75, heightU: 1 },
  { id: '3', label: '3 × 1 u', widthU: 3, heightU: 1 },
  { id: '6.25', label: 'Spacebar 6.25 × 1 u', widthU: 6.25, heightU: 1 },
  { id: '7', label: 'Spacebar 7 × 1 u', widthU: 7, heightU: 1 },
] as const satisfies readonly {
  readonly id: string;
  readonly label: string;
  readonly widthU: number;
  readonly heightU: number;
}[];
