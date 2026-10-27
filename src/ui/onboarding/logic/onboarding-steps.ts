import type { OnboardingStepId } from '@domain/onboarding';
import type { WorkspaceId } from '@storage/preferences';

export type OnboardingTargetId =
  | 'project-name'
  | 'project'
  | 'schematic-editors'
  | 'controller'
  | 'workspace'
  | 'editor-area'
  | 'kle'
  | 'settings';
type Step = {
  readonly title: string;
  readonly why: string;
  readonly action: string;
  readonly target: OnboardingTargetId;
  readonly workspace: WorkspaceId;
  readonly requiresAction?: boolean;
};
export const ONBOARDING_CONTENT = {
  name: {
    title: 'Name your macropad',
    why: 'A project contains your layout, wiring and keymap. A short name identifies the exported shield. Your original work is protected in this learning session.',
    action:
      'Enter “My macropad” in Name and press Enter. Save downloads Project JSON; accepted edits autosave here. Undo and Redo reverse edits.',
    target: 'project-name',
    workspace: 'schematic',
    requiresAction: true,
  },
  layout: {
    title: 'Place nine keys',
    why: 'Schematic defines the physical positions. 1u is one standard key pitch. We will make three rows of three keys.',
    action:
      'Open Parts, then expand Keys. Use Add key nine times, then set X/Y to (0,0), (1,0), (2,0), (0,1), (1,1), (2,1), (0,2), (1,2), (2,2). Commit fields with Enter. You can also place keys on the canvas. Keep rotation at 0°. Undo repairs mistakes.',
    target: 'workspace',
    workspace: 'schematic',
    requiresAction: true,
  },
  controller: {
    title: 'Choose a controller',
    why: 'The controller reads the switches. Only its available connector GPIOs can be used; power and reset contacts are reserved.',
    action:
      'Open Controller and choose a supported board. nice!nano v2 is a suitable example. If it is already selected, review its description and confirm below.',
    target: 'controller',
    workspace: 'schematic',
  },
  diodes: {
    title: 'Add switch diodes',
    why: 'Diodes let a matrix distinguish simultaneous key presses. All nine switches need consistent polarity.',
    action:
      'In Parts, expand Keys and use Add diode at key N pin 1 for all nine keys. Keep every cathode away from its switch. Wiring will use the matching diode direction.',
    target: 'schematic-editors',
    workspace: 'schematic',
    requiresAction: true,
  },
  wiring: {
    title: 'Connect the matrix',
    why: 'A 3×3 matrix reads nine keys with six lines: three rows and three columns. Wire crossings and diode polarity determine the real electrical connections.',
    action:
      'Open Wiring, keep Unibody and Matrix, choose the matching diode direction, then Rebuild wiring. Inspect the local connections and the output blocks (rows above, columns at the outer side), then press Apply. Manual wiring is also supported. Preview alone is not saved.',
    target: 'schematic-editors',
    workspace: 'schematic',
    requiresAction: true,
  },
  pins: {
    title: 'Check the six GPIOs',
    why: 'Each row and column needs a distinct available controller pin. Suggested pins describe configuration, not detected physical hardware.',
    action:
      'Review all three row and three column pins in Wiring. Correct conflicts and Apply if needed. If the proposal already assigned six valid pins, confirm after checking them against your planned hardware.',
    target: 'schematic-editors',
    workspace: 'schematic',
  },
  bindings: {
    title: 'Assign digits 1–9',
    why: 'Bindings determines what each physical key does. The Base layer is active by default.',
    action:
      'Select each key in the canvas or Keys table, choose Key press in the Action panel and assign digits 1–9 from left to right, top to bottom. The canvas and table share selection. Use the table to work entirely by keyboard.',
    target: 'workspace',
    workspace: 'bindings',
    requiresAction: true,
  },
  problems: {
    title: 'Check Problems',
    why: 'Problems lists invalid names, wiring, pins and actions. Its entries take you to the control that needs repair. Export uses the same checks.',
    action:
      'Open Problems and inspect the list. Fix any issues through their links. An empty list means no current validation issues; you do not need to create an error to continue.',
    target: 'editor-area',
    workspace: 'schematic',
  },
  firmware: {
    title: 'Review firmware options',
    why: 'Firmware controls typed ZMK v0.3.0 build settings such as sleep and debounce. Each supported setting has a description and pinned documentation link.',
    action:
      'Inspect the settings. Keep compatible defaults for this macropad, or change a supported value. Confirm when there are no validation issues.',
    target: 'workspace',
    workspace: 'firmware',
  },
  files: {
    title: 'Inspect generated files',
    why: 'Export previews the actual repository files. The keymap assigns actions, .conf carries settings, and shield files describe the hardware.',
    action:
      'Focus or open the preview of a .keymap file, a .conf file and a boards/shields file. Confirm after inspecting all three groups. The ZIP will contain these same current files.',
    target: 'workspace',
    workspace: 'export',
  },
  'discovery-project': {
    title: 'Other ways to start',
    why: 'New project offers ready presets. Open restores Project JSON; Save keeps a portable copy. KLE import brings in a physical layout. Create with agent downloads a creation package for an external assistant.',
    action:
      'Find New, Open, Save and Create with agent in the project bar. KLE import is in New. These alternatives replace or create projects with their normal safeguards; no import or preset is required here.',
    target: 'project',
    workspace: 'schematic',
  },
  'discovery-import': {
    title: 'Import a KLE layout',
    why: 'KLE import converts a Keyboard Layout Editor JSON layout into editable physical keys. It replaces project content through the usual review and Apply flow.',
    action:
      'Find Import KLE layout in New. No file import is required for this macropad; keep your current nine keys and continue.',
    target: 'kle',
    workspace: 'schematic',
  },
  'discovery-bindings': {
    title: 'Layers and advanced actions',
    why: 'Layers provide alternate keymaps. Standard and custom behaviors include hold-tap, tap-dance and sticky keys. Combos trigger from several keys; macros perform sequences; conditional layers activate from other layers.',
    action:
      'Notice the layer bar and the behavior, combo, macro and conditional-layer libraries in Bindings. These are optional: keep the single Base layer and nine digits for this macropad.',
    target: 'workspace',
    workspace: 'bindings',
  },
  'discovery-hardware': {
    title: 'Hardware and app settings',
    why: 'Schematic also supports encoders, controller choices, split topology and supported scan modes. Settings controls theme, grid, snapping and rulers separately from Project data.',
    action:
      'Notice Controller, Wiring and Parts in Schematic; Parts contains folded Keys, Encoders, Wire sections, Wires and Crossings, and the Settings gear in the lower navigation. No advanced hardware or settings change is needed. Firmware options are in their own workspace.',
    target: 'schematic-editors',
    workspace: 'schematic',
  },
  'discovery-settings': {
    title: 'App settings',
    why: 'Settings controls theme, grid, snapping and rulers separately from Project data. Firmware options remain in their own workspace.',
    action:
      'Notice the Settings gear in the lower navigation. You can open and close Settings to inspect preferences, then continue without changing the macropad.',
    target: 'settings',
    workspace: 'schematic',
  },
  download: {
    title: 'Download your ZMK configuration',
    why: 'This ZIP is a ready-to-build zmk-config repository for ZMK v0.3.0. It is not a compiled firmware image.',
    action:
      'Choose Download .zip. After downloading, build externally with the repository workflow or local ZMK tools, then flash using your controller’s instructions. This app does not build or flash hardware.',
    target: 'workspace',
    workspace: 'export',
    requiresAction: true,
  },
  finish: {
    title: 'Your macropad configuration is ready',
    why: 'You created and exported a real 3×3 macropad. Browser handoff succeeded; physical assembly, firmware build and flashing remain external steps.',
    action:
      'Return to your original project, or explicitly keep this learning project as your current project. You can restart from the lower Take the tour again button at any time.',
    target: 'workspace',
    workspace: 'export',
  },
} as const satisfies Record<OnboardingStepId, Step>;
export function getOnboardingContent(step: OnboardingStepId): Step {
  return ONBOARDING_CONTENT[step];
}
