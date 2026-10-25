# Design decisions

- Use nearest-tree connections instead of per-key stars: removes repeated long output leads with stable bounded work; no global optimum promise. Rejected full grid search: disproportionate complexity/dependency and unconstrained memory for arbitrary coordinates.
- Two vertical exterior blocks: readable compact grouping without horizontal 4.5u-per-label spread. Move whole pair for obstructions to preserve alignment.
- Preserve logical cell grouping and direct routing: electrical hardware cannot be inferred from geometry, and user asked for connections/output groups. No schema change: key-pin endpoints already encode shared tree topology.
- Existing net/overlap/crossing analysis independently validates result. Coincident contacts on unrelated nets refuse, never hide a short behind insulation.
