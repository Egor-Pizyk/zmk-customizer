# Roadmap — current major +1

Status: discovery draft, 2026-10-21. No numeric release version assigned. This is the basis for discussion, not an approved feature sequence or implementation plan. The [existing roadmap](roadmap.md) ends with the first major release. No feature numbers are reserved here.

## Confirmed direction

Build a new module for keyboard mechanical design and generation of the parts needed for assembly: enclosure, switch mounting, plates, bottom and accommodation of the controller and related components. The existing module addresses the keyboard as a control interface, including wiring, bindings and firmware configuration.

- Two independent business modules in a monorepository. A person must be able to use either without configuring or using the other. Share business concepts, functions and infrastructure only where their meaning genuinely matches. Shared logging is an example of possible infrastructure, not a request to add logging now.
- The modules can work together to generate a case for a keyboard designed in the existing module. Exact exchange and update behavior remains to be agreed.
- Start with flat unibody and split keyboards. Curved keywells and individually tilted keys belong to a later stage; that stage's release allocation is undecided.
- Primary manufacturing target: home FDM 3D printing.
- Primary assembly flow: design → print → install components → solder. Fitting a new case around an already soldered matrix is not the initial scenario.
- Start with a small verified component catalog and expand it. Advanced user dimensions are acceptable in principle; their scope and verification status remain open.
- The experience must be usable without CAD knowledge and retain the product's overall visual style. Component choices should determine appropriate mounting geometry rather than asking beginners to draw it.

These directions come from the user. The proposals below have not yet been approved.

## Proposed product approach for discussion

Start from the desired assembly, then select compatible components and adjust the layout and enclosure. Offer an understandable complete keyboard before exposing its individual parts. A possible flow is: layout → components → enclosure and mounting → inspect → test fit → export parts and assembly guidance. This is a flow hypothesis to test with a beginner, not a fixed set of screens.

Borrow Cosmos's visible component-aware design, Ergogen's layout-derived geometry, Flatboard's constrained flat-case generation and Klavgen's attention to hand assembly. The intended advantage is a coherent path from real component choices to a buildable set of parts, with clear limitations. Merely adding more geometry settings is not a sufficient advantage. See the [research and two-round critique](research/next-major-discovery.md).

Proposals requiring agreement:

- Begin with a small number of construction recipes rather than unrestricted CAD. Investigate one removable-bottom design first; choose its actual fastening only after testing it. Do not assume that every design requires three separate plate/shell/bottom pieces.
- Let beginners choose a whole assembly and reveal part controls progressively. Keep the current tokens, typography, accessible controls and Undo/Redo conventions; investigate navigation appropriate for a 3D workspace.
- Provide a small fit-test print before committing to a full case. It checks selected local fits on the user's printer, not overall strength, warping or complete assembly.
- Distinguish measured geometric conflicts, approximate clearance checks and physically tested combinations. A clear scene or watertight mesh is not proof of printability or assembly success.
- Supply instructions for supported construction recipes. Automatically planning assembly for arbitrary models is not proposed for the first scope.
- Keep custom dimensions visibly distinct from verified component profiles. Reserve space for unknown hardware without claiming that its mounting and service access are verified.

## Candidate discovery gates

These are investigation outcomes, not implementation tasks. Their order and eventual release scope require user agreement.

| Gate | Evidence needed before committing the corresponding product scope |
|---|---|
| Reference assembly | Agree exact switches, keycaps, controller, wiring approach and fastening; identify stabilizers, battery and connectors if included |
| Mechanical feasibility | Print and assemble a complete supported flat reference design; record fit, cable/solder access, disassembly and limits, alongside a local fit sample |
| Browser geometry | Demonstrate the selected construction and required exports offline; measure latency, memory, failure recovery, cancellation, Undo during calculation and prevention of stale exports on agreed devices |
| Beginner workflow | Test component selection, enclosure changes, conflict correction and export with a person without CAD experience; review the proposed screen layout in both themes |
| Independent modules | Compare document ownership, persistence, migrations, validation and history options; demonstrate that each module works with no data from the other |
| Interoperability | Agree layout ownership, key identity, units, coordinate systems, half identity and supported changes; test explicit transfer without losing existing user data |
| Monorepository | Decide package/application boundaries from the above contracts, record required architecture/dependency decisions, then specify migration without changing existing behavior |
| Expanded scope | Add component combinations and split assembly evidence; reassess 3D poses and curved geometry separately rather than treating curvature as a small flat-case option |

No experiments or prototypes listed above have been performed in this documentation task.

## Open decisions to discuss

1. Which exact hardware combination should become the first reference assembly? Which switch families and controller variants must be available in the first major +1 scope?
2. How much construction freedom should beginners get initially: one tested enclosure recipe or several? Which custom dimensions are necessary?
3. Handwired only initially, or compatibility with existing PCBs? Are wireless builds, batteries, stabilizers, non-1u keys, tenting and wrist rests required initially or later?
4. Which exports are necessary: printing meshes only, or editable CAD as well? Decide this before choosing a geometry engine.
5. Is the initial layout transfer a snapshot creating an independent enclosure project, or must later changes be reviewable and applied too? Automatic live synchronization and two-way editing are not agreed.
6. Do the modules share one shell, have independent entry points, or ship as separate applications? Business independence is confirmed; deployment topology is not.
7. How will component dimensions, source revisions and physical verification be maintained, and who can print/test the reference assemblies?

## Constraints to resolve before specification

Current [principles](principles.md), [architecture](architecture.md) and [tooling policy](tooling.md) remain authoritative. This draft does not amend them. In particular:

- Resolve the single serializable `Project` policy against independently usable module documents; preserve old projects, migrations and immutable edits.
- Do not infer mechanical switch/holder dimensions from a keycap rectangle or a controller's electrical schematic symbol. Existing key positions are useful physical-layout input, but are not a complete mechanical description.
- Separate firmware readiness from mechanical readiness so missing bindings or GPIO assignments do not block standalone case generation.
- Investigate storing design parameters and deriving meshes, keeping heavy computed geometry out of snapshot history.
- Reconcile asynchronous geometry work with the current synchronous UI guidance before implementing a CAD workflow. Clearly associate previews and exports with the design revision that produced them.
- Preserve the static/offline/no-backend direction unless the user explicitly changes it. A candidate dependency needs an ADR; no CAD engine or workspace tool is selected here.
- Reuse ideas independently from code or assets. Check provenance and licenses for any actual reuse; Cosmos documents different licenses for code, models and documentation and has non-public features.
- Preserve accessibility with a useful structured alternative to manipulating the 3D scene, as well as keyboard selection and editing.

After these decisions, create feature specifications and an implementation sequence through the existing workflow. Do not start monorepo restructuring, engine integration or UI implementation from this draft alone.
