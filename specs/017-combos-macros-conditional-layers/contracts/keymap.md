# Output contract: 017

At most one each of combos/macros/conditional_layers beneath root; omit empty sections. Use compatible strings zmk,combos; zmk,behavior-macro with cells 0; zmk,conditional-layers. Explicitly sort definitions by stable generated label/node name. Names use separate user_macro/user_combo/user_rule prefixes and stable ID suffixes, avoiding built-ins and 016 labels.

Combo emits current key indices, one rendered Binding, timeout and layer filter only when nonempty. Macro emits explicit wait-ms/tap-ms and ordered controls/bindings. Action step emits mode plus rendered Binding; wait step emits wait-time N, press, none, configured wait-time. Conditional rule emits current if-layers indices and then-layer index. Headers and inline custom definitions are collected from all action locations.

Semantic validation precedes generation and blocks dangling references, invalid settings, cycles or firmware budgets. No deprecated/main-only properties or manual behavior-enable Kconfig symbols.
