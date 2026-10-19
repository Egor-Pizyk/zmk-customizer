const DOCS = 'https://v0-3-branch.zmk.dev/docs/keymaps';
export const MACRO_OPTIONS = {
  label: 'Macro',
  description: 'Run an ordered sequence of presses, taps, releases and pauses.',
  docsUrl: `${DOCS}/behaviors/macros`,
} as const;
export const ADVANCED_OPTIONS = {
  comboKeys: {
    label: 'Combo keys',
    description: 'Press 2–20 selected keys together to trigger this action.',
    docsUrl: `${DOCS}/combos#configuration`,
  },
  timeoutMs: {
    label: 'Combo timeout (ms)',
    description: 'Time window for pressing every combo key.',
    docsUrl: `${DOCS}/combos#configuration`,
  },
  comboLayers: {
    label: 'Combo layers',
    description:
      'Only active when the highest active layer is selected; no selection means all layers.',
    docsUrl: `${DOCS}/combos#advanced-usage`,
  },
  waitMs: {
    label: 'Wait between actions (ms)',
    description: 'Interval after each action before the next queued event.',
    docsUrl: `${DOCS}/behaviors/macros#wait-time`,
  },
  tapMs: {
    label: 'Tap duration (ms)',
    description: 'Time between press and release of each tap.',
    docsUrl: `${DOCS}/behaviors/macros#tap-time`,
  },
  durationMs: {
    label: 'Pause duration (ms)',
    description: 'Wait without sending a host key; then resume the configured interval.',
    docsUrl: `${DOCS}/behaviors/macros#wait-time`,
  },
  stepKind: {
    label: 'Step kind',
    description: 'Tap, press, release a selected action, or insert a pause.',
    docsUrl: `${DOCS}/behaviors/macros#macro-controls`,
  },
  ifLayerIds: {
    label: 'Input layers',
    description: 'All selected layers must be active to enable the target.',
    docsUrl: `${DOCS}/conditional-layers#configuration`,
  },
  thenLayerId: {
    label: 'Target layer',
    description:
      'Automatically controlled by this rule; keep it above all input layers. Manual activation is overridden.',
    docsUrl: `${DOCS}/conditional-layers#configuration`,
  },
} as const;
export const MACRO_STEP_KINDS = ['tap', 'press', 'release', 'wait'] as const;
