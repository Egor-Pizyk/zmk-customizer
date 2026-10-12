// Node name of a layer in the generated keymap: `[a-z0-9_,.+-]` (docs/zmk/keymap.md §1), the
// shield-name sanitizing plus `_layer`; `layer_` goes before a digit because a Devicetree node
// name starts with a letter (Devicetree spec §2.2.1). '' = no usable character (spec 007 R4).
export function toLayerNodeName(name: string): string {
  const core = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '_')
    .replaceAll(/^_+|_+$/gu, '');
  if (core === '') {
    return '';
  }
  return /^[0-9]/u.test(core) ? `layer_${core}_layer` : `${core}_layer`;
}
