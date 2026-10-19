const hardwareDocs =
  'https://v0-3-branch.zmk.dev/docs/development/hardware-integration/encoders#devicetree-file';
export const ENCODER_LIMITS = { maxSteps: 360, maxTriggers: 360, rotationDegrees: 360 } as const;
export const ENCODER_DEFAULTS = { steps: 80, triggersPerRotation: 20 } as const;
export const ENCODER_OPTIONS = {
  steps: {
    label: 'Electrical steps per rotation',
    description:
      'Electrical transitions in one full turn; v0.3 supports 1–360. Check the encoder datasheet.',
    defaultValue: 80,
    min: 1,
    max: ENCODER_LIMITS.maxSteps,
    docsUrl: hardwareDocs,
  },
  triggersPerRotation: {
    label: 'Triggers per rotation',
    description:
      'Actions per full turn. Choose a divisor of 360 (for example 10, 20, 24 or 30) for exact v0.3 timing.',
    defaultValue: 20,
    min: 1,
    max: ENCODER_LIMITS.maxTriggers,
    docsUrl: 'https://v0-3-branch.zmk.dev/docs/config/encoders#devicetree',
  },
  pins: {
    label: 'A/B pins',
    description: 'Connect A and B to separate GPIO pins; connect the common pin to ground.',
    docsUrl: hardwareDocs,
  },
  rotation: {
    label: 'Rotation actions',
    description:
      'Each turn taps the chosen action. Unassigned directions do nothing. Add the push switch as an ordinary key.',
    docsUrl: 'https://v0-3-branch.zmk.dev/docs/keymaps/behaviors/sensor-rotate#sensor-rotation',
  },
} as const;
