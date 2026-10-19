# Keymap contract: 016

Emit named instances beneath the single behaviors container along with preserved inline instances. Labels use a user prefix, sanitized name and stable ID suffix; deterministic definition order is label order. Hold-tap emits compatible zmk,behavior-hold-tap, cells 2, phandle targets without parameters, explicit flavor/tapping term and configured properties. Sticky variants emit compatible zmk,behavior-sticky-key, cells 1, kp/mo target and explicit release timeout. Tap-dance/mod-morph emit cells 0 and complete child bindings. Trigger positions and layer arguments resolve IDs at generation time. No deprecated properties or main-only syntax.

Missing targets, cycles, malformed arguments or settings block export through normal analysis before generation. Generator input must already be valid. A named custom reference is rendered using its current label and typed parameters. Existing inline behavior names and output remain stable for projects without new definitions.
