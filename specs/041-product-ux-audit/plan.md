# Implementation plan

Use current presentation primitives and UI ownership boundaries. Project data, electrical analysis and generators stay out of this change.

- [010 Export](../010-export-download/spec.md): put shared repair links first when blocked and keep ready-state ZIP controls above the workflow option.
- [012 Layout](../012-layout-editor/spec.md), [018 KLE](../018-kle-import/spec.md): keep independent import accessible while gating actions on existing keys.
- [004 Bindings](../004-bindings-keycaps/spec.md), [007 Layers](../007-layers/spec.md), [016 Behaviors](../016-custom-behaviors/spec.md), [017 Advanced keymap](../017-combos-macros-conditional-layers/spec.md): reorder existing content without changing the editors or their focus contracts.
- [015 Firmware](../015-kconfig-settings/spec.md): focus the existing search field after clearing with a field ref.
- [037 Onboarding](../037-interactive-onboarding/spec.md): describe the changed Export and Firmware interactions using stable targets.

Follow the React, accessibility, Tailwind and admin UI guidelines. Write browser assertions before the change. Review both themes and narrow and desktop windows in isolated Playwright. Use focused diagnostics and final changed checks. See [verification](verification.md).
