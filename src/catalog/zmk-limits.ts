/** Pinned v0.3 limits: docs/zmk/{keymap,kconfig-options,physical-layout}.md. */
export const ZMK_LIMITS = {
  layerCount: 32,
  keyboardNameBytes: 16,
  layerNodeNameLength: 31,
  layerDisplayNameBytes: 19,
  minLayoutCell: -32_768,
  maxLayoutCell: 32_767,
} as const;
