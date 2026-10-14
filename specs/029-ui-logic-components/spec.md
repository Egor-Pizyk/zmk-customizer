# Separate UI logic and components

## Requirements
Split every source responsibility group that directly contains both .ts and .tsx implementation files into logic/ (.ts functions, hooks and types) and components/ (.tsx React rendering). Each populated child has an explicit named index.ts and its own exact alias. Index files are exempt from extension grouping. Preserve existing responsibility boundaries, behavior, storage and generated output.

## Acceptance
No source UI folder directly mixes implementation extensions. Consumers use owning child aliases. No dependency cycles or weakened architectural restrictions. Existing tests, production build and browser journeys pass.
