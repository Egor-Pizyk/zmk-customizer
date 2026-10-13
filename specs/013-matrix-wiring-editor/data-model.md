# Data Model: Project v7 Wiring

## Project

schemaVersion becomes 7. Existing name/controllerId/shieldName/keys/wires/insulatedCrossings/layers remain. Add wiring metadata with scan type `matrix | direct`, topology `unibody | split`, explicit diodeDirection and ordered buses per half. A legacy incomplete project's ordered metadata may be uninitialized; it is editable but cannot export as a configured v7 scan until derivation/initialization succeeds.

## Half and key identity

Half identifiers are `left | right`; unibody uses left. Key half is optional with effective default left. Split initialization assigns every existing key based on rotated center; manual half changes follow keyId and trigger rewiring. Duplicate inherits physical geometry/bindings but has no connected wires; it remains electrically unassigned. Deleting/reordering keys cannot shift memberships.

## Terminal

A terminal has stable unique id, owning half and kind `row | col | input | ground`. Row/col/input terminals have optional connector GPIO index and optional dropped prior assignment label; ground has neither. Ordered row/col/input terminal-id lists define local indices. Exactly one ground terminal per initialized direct half. GPIO is a nonnegative integer structurally; selected-board availability and uniqueness are domain issues. IDs follow the existing bounded id length and a documented terminal-prefix pattern; choose `t<number>`.

Each terminal appears exactly once in its owning axis list; wrong kind, duplicate IDs and dangling references are schema errors. Physically conflicting circuits and duplicate GPIO are editable domain issues.

## Wire endpoints and connectivity

Extend free endpoints with optional terminalId, mutually exclusive with legacy boardPin/droppedBoardPin. Their coordinates continue to locate the visible endpoint. Multiple branches reference one physical terminal, so getNets joins these references; draw the terminal identity/pin/GND label at each branch. Key-pin and junction forms are retained. An endpoint's half comes from its referenced terminal/key; junction dependencies must agree with owning-half inference.

Inter-half explicit links are domain issues. Geometric contacts between distinct known halves do not join. Ambiguous or malformed half ownership is never silently ignored. Every directly connected key uses one input net and one ground net; every matrix key uses one row and one column net, with diode direction consistent with its actual contact assignment.

## Derived scan

Derived wiring has per-half ordered GPIO arrays, scan kind, diode direction for matrix, and one global cell per project key. No persisted independent key-to-cell Record exists. Dimensions satisfy `1..255`; local cells satisfy row < rows and col < columns; split global column count and offsets also fit 255. Matrix maximum dimensions are additionally bounded by board pin capacity and current project budgets. Missing assignment is represented by absence, not -1 in exported output.

Valid unibody matrix contract can adapt to the existing ShieldMatrix shape to preserve formatting. Valid split uses rows = maximum half rows and columns = left columns + right columns; global right key col = left column count + local col. Direct uses row 0 and ordered input count per half.

## Drafts and transitions

UI holds local draft fields and a pure domain-generated preview Project. Preview is not saved. Apply verifies the base project still matches, then commits once; Cancel/Escape/stale project clear the draft. No-op preserves project identity and Redo. Switching scan type discards incompatible electrical assignments only in an explicit preview, not in hidden caches. Matrix direction reversal previews appropriate per-key diodes. Connection edits preserve geometry/layers and unaffected wiring.

## Migration/trust boundary

v6→v7 never rewrites bends, wire IDs, crossing ordinals or layers. Migration only bumps the version and preserves all endpoints. On the first editor action, a valid legacy matrix seeds axis order/direction exactly from legacy derivation and converts assigned endpoints to terminal references without rerouting. Untouched legacy exports remain byte-identical. Invalid old topology remains loadable with repair issues and original endpoint data. Maintain v1→…→v7 chain; untrusted input is parsed only by storage, with existing bytes/key/wire/segment/crossing limits and a terminal limit bounded by wire budget. Newer versions/malformed references leave current project unchanged.

Implementation refinement: imported matrices are also bounded to 8192 grid cells per half using the existing processing budget; editor operations refuse dimensions needing more GPIOs than the selected board exposes. This bounds rendering work and rejects physically impossible dimension changes before routing.
