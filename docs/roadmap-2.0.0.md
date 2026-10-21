# Roadmap — 2.0.0

Status: discovery draft, 2026-10-21. Target release: **2.0.0**, explicitly selected by the user. This is the basis for discussion, not an approved feature sequence or implementation plan. The [existing roadmap](roadmap.md) ends with the first major release. No feature numbers are reserved here.

## Confirmed direction

Build a new module for keyboard mechanical design and generation of the parts needed for assembly: enclosure, switch mounting, plates, bottom and accommodation of the controller and related components. The existing module addresses the keyboard as a control interface, including wiring, bindings and firmware configuration.

- Two independent business modules in a monorepository. A person must be able to use either without configuring or using the other. Share business concepts, functions and infrastructure only where their meaning genuinely matches. Shared logging is an example of possible infrastructure, not a request to add logging now.
- The modules exchange physical layouts in both directions. Users can create a case from the existing module, freely edit the layout in the case constructor, and explicitly return those changes to the existing module. Reviewable updates and independent use are part of the 2.0.0 direction; automatic live synchronization is not selected.
- Start with flat unibody and split keyboards. Curved keywells and individually tilted keys belong to a later stage; that stage's release allocation is undecided.
- Primary manufacturing target: home FDM 3D printing.
- Primary assembly flow: design → print → install components → solder. Fitting a new case around an already soldered matrix is not the initial scenario.
- Start with a small verified component catalog and expand it. Advanced user dimensions are acceptable in principle; their scope and verification status remain open.
- First construction: an upper part with switch mounting and a removable bottom, with individual-part settings revealed progressively. The precise fastening remains to be validated.
- Initial controller scope: Arduino Pro Micro, nice!nano v2 and selected nRF52840 alternatives. Exact board revisions, connectors and mounting envelopes require individual profiles; a common MCU or electrical pinout does not establish identical mechanics. Mechanical support does not imply firmware support by the existing ZMK module.
- Initial switch scope: conventional full-height MX-compatible Gateron and Gateron KS-33 Low Profile 2.0 as separate mechanical profiles, with compatible keycaps, including MX-style compatibility where applicable. Exact mechanical families and keycap combinations remain to be selected; do not treat all low-profile Gateron or all cross-stem keycaps as interchangeable.
- Initial controller accommodation covers the board and USB access. Battery support is a confirmed future requirement, not part of the initial assembly. Revisit battery, switch, wiring clearance and service access before fixing a construction that could prevent this extension; no battery dimensions or mounting system are selected now.
- Desired exports: printing files and editable CAD such as STEP, conditional on avoiding disproportionate complexity. Evaluate native CAD export in engine discovery; retain the condition until feasibility is demonstrated.
- The experience must be usable without CAD knowledge and retain the product's overall visual style. Component choices should determine appropriate mounting geometry rather than asking beginners to draw it.

These directions come from the user. The proposals below have not yet been approved.

## Proposed product approach for discussion

Start from the desired assembly, then select compatible components and adjust the layout and enclosure. Offer an understandable complete keyboard before exposing its individual parts. A possible flow is: layout → components → enclosure and mounting → inspect → test fit → export parts and assembly guidance. This is a flow hypothesis to test with a beginner, not a fixed set of screens.

Borrow Cosmos's visible component-aware design, Ergogen's layout-derived geometry, Flatboard's constrained flat-case generation and Klavgen's attention to hand assembly. The intended advantage is a coherent path from real component choices to a buildable set of parts, with clear limitations. Merely adding more geometry settings is not a sufficient advantage. See the [research and two-round critique](research/2.0.0-discovery.md).

Proposals requiring agreement:

- Build on the accepted upper-part/removable-bottom construction; choose its actual fastening only after testing it. Additional construction recipes remain proposals. Do not assume that every design requires three separate plate/shell/bottom pieces.
- Keep the current tokens, typography, accessible controls and Undo/Redo conventions within the accepted progressive-disclosure approach; investigate navigation appropriate for a 3D workspace.
- Provide a small fit-test print before committing to a full case. It checks selected local fits on the user's printer, not overall strength, warping or complete assembly.
- Distinguish measured geometric conflicts, approximate clearance checks and physically tested combinations. A clear scene or watertight mesh is not proof of printability or assembly success.
- Supply instructions for supported construction recipes. Automatically planning assembly for arbitrary models is not proposed for the first scope.
- Keep custom dimensions visibly distinct from verified component profiles. Reserve space for unknown hardware without claiming that its mounting and service access are verified.

## Bidirectional layout exchange — accepted direction

The user selected editing the layout in the case constructor and returning changes to the existing module. A one-time import alone does not meet this direction. Both modules must remain independently usable, including creation without a source project from the other module.

Specification must define the following preservation and review behavior before implementation:

- Explicit transfer/update in either direction, with a preview of added, removed, moved, resized and reassigned-half keys, then Apply/Cancel. No silent cross-module writes.
- Preserve stable key identities and existing per-layer bindings for retained keys. Surface added/deleted keys and affected wiring or references; do not invent physical electrical connections or silently reassign GPIOs. Define new-key defaults and deletion consequences during specification.
- Preserve enclosure-only settings when updating its layout. Recheck affected mounting, contours and component clearances rather than assuming the old geometry is still valid.
- Detect when both documents have changed since exchange; show conflicts instead of silently overwriting local work. Choose the matching/baseline mechanism during planning; no particular merge algorithm is approved.
- Apply changes as an undoable operation in the receiving module. Define independent history, save/reload and provenance behavior; do not promise an implicit Undo across two documents.
- Keep validation/export readiness scoped to the receiving product. A stale or failed case calculation must not block firmware work; case export must describe the current successfully calculated design.
- Specify the shared layout contract's units, rotation origins, half identity and size meaning. A keycap's nominal size is not a switch mounting aperture. The first-major standard-keycap-size follow-up in [012](roadmap.md#012--layout-editor) is relevant input, not proof of component compatibility.

These are requirements to clarify and specify, not an implementation plan. Transport, project linking, copy/fork matching, conflict UI and future 3D-to-2D exchange remain open.

## Candidate discovery gates

These are investigation outcomes, not implementation tasks. Their order and eventual release scope require user agreement.

| Gate | Evidence needed before committing the corresponding product scope |
|---|---|
| Reference assembly | Agree exact switches, keycaps, controller, wiring approach and fastening; identify stabilizers, battery and connectors if included |
| Mechanical feasibility | Print and assemble a complete supported flat reference design; record fit, cable/solder access, disassembly and limits, alongside a local fit sample |
| Browser geometry | Demonstrate the selected construction and required exports offline; measure latency, memory, failure recovery, cancellation, Undo during calculation and prevention of stale exports on agreed devices |
| Beginner workflow | Test component selection, enclosure changes, conflict correction and export with a person without CAD experience; review the proposed screen layout in both themes |
| Independent modules | Compare document ownership, persistence, migrations, validation and history options; demonstrate that each module works with no data from the other |
| Interoperability | Specify the accepted two-way workflow: ownership, key identity, units, halves, change/conflict review and preservation of bindings/wiring/mechanical settings; test both directions without losing existing user data |
| Monorepository | Decide package/application boundaries from the above contracts, record required architecture/dependency decisions, then specify migration without changing existing behavior |
| Expanded scope | Add component combinations and split assembly evidence; reassess 3D poses and curved geometry separately rather than treating curvature as a small flat-case option |

No experiments or prototypes listed above have been performed in this documentation task.

## Open decisions to discuss

1. Select exact full-height Gateron, low-profile Gateron and keycap combinations, plus Pro Micro/nice!nano v2/alternative board revisions. KS-33 Low Profile 2.0 and conventional MX-compatible Gateron are accepted families; exact SKUs and keycaps remain open. Which combination should be physically tested first?
2. Which fastening and custom dimensions are necessary within the accepted upper-part/removable-bottom construction? Additional recipes and free part composition remain later proposals.
3. Handwired only initially, or compatibility with existing PCBs? Battery support is confirmed for a later stage; its battery/switch specification and scheduling remain open. Are stabilizers, non-1u keys, tenting and wrist rests required initially or later?
4. Can printing output plus genuine STEP solids be delivered without disproportionate complexity? Evaluate before selecting a geometry engine. STEP geometry supports downstream CAD modification but does not promise the original parametric feature history; retain the app project as the editable design source.
5. For the accepted bidirectional layout exchange, how are project pairs and copied/forked documents matched, conflicting edits resolved and incompatible future 3D geometry represented? Transport and conflict-resolution details remain open; one-time-only transfer is insufficient.
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
