# Roadmap — 2.0.0

Status: discovery draft, 2026-10-21. Target release: **2.0.0**, explicitly selected by the user. This is the basis for discussion, not an approved feature sequence or implementation plan. The [existing roadmap](roadmap.md) ends with the first major release. No feature numbers are reserved here.

## Confirmed direction

Build a new module for keyboard mechanical design and generation of the parts needed for assembly: enclosure, switch mounting, plates, bottom and accommodation of the controller and related components. The existing module addresses the keyboard as a control interface, including wiring, bindings and firmware configuration.

- Two independent business modules in a monorepository. A person must be able to use either without configuring or using the other. Share business concepts, functions and infrastructure only where their meaning genuinely matches. Shared logging is an example of possible infrastructure, not a request to add logging now.
- The modules exchange physical layouts in both directions. Users can create a case from the existing module, freely edit the layout in the case constructor, and explicitly return those changes to the existing module. Reviewable updates and independent use are part of the 2.0.0 direction; automatic live synchronization is not selected.
- Start with flat unibody and split keyboards. Curved keywells and individually tilted keys belong to a later stage; that stage's release allocation is undecided.
- Primary manufacturing target: home FDM 3D printing.
- Initial build is PCB-free and hot-swap-free: solder wires directly to switch contacts. Existing-PCB mounting and hot-swap socket/holder systems are excluded from the initial scope.
- Stabilizers are excluded initially; adding them later is a confirmed extension direction. Do not present unsupported stabilized keycap combinations as verified builds; research future mounting/clearance needs without implementing stabilizers now.
- Primary assembly flow: design → print → install components → solder. Fitting a new case around an already soldered matrix is not the initial scenario.
- Start with a small verified component catalog and expand it. Advanced user dimensions are acceptable in principle; their scope and verification status remain open.
- First construction: an upper part with switch mounting and a removable bottom, with individual-part settings revealed progressively. Generate the contour around the layout with adjustable margins, height and rounding. Free-drawn outlines are a later extension. Select one physically verified bottom fastening; keep reset access optional rather than requiring a reset opening in every case.
- Initial controller scope: Arduino Pro Micro, nice!nano v2 and selected nRF52840 alternatives. Exact board revisions, connectors and mounting envelopes require individual profiles; a common MCU or electrical pinout does not establish identical mechanics. Mechanical support does not imply firmware support by the existing ZMK module.
- Initial switch scope: conventional full-height MX-compatible Gateron and Gateron KS-33 Low Profile 2.0 as separate mechanical profiles, with compatible keycaps, including MX-style compatibility where applicable. Exact mechanical families and keycap combinations remain to be selected; do not treat all low-profile Gateron or all cross-stem keycaps as interchangeable.
- Obtain component dimensions and switch/keycap 3D models from suitable publicly available Internet sources, prioritizing manufacturer drawings and traceable open assets. Record exact part/revision, URL, license, units, orientation, modifications and verification status; public availability alone does not grant redistribution rights or prove dimensional accuracy. Bundle approved/pinned assets for offline use. Separate visual models from authoritative fit dimensions and simplified clearance geometry.
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

## Dedicated feature — mechanical technology research

**Working name:** `mechanical-technology-research`; a separate research feature before production CAD integration and monorepo restructuring. Assign its immutable Spec Kit number only when formally specifying it; this documentation task does not create a feature directory. The user requires a full comparative study and an evidence-backed ADR choosing language, framework and geometry kernel. [ADR 0022](decisions/0022-mechanical-technology-evaluation.md) records this evaluation gate, not a technology selection.

**Questions to answer independently**

- UI framework and renderer, application/domain orchestration language, geometry kernel, execution boundary and build tooling are separate decisions. Evaluate retaining the existing TS/React UI with a different compute layer as well as justified alternatives; do not equate a language rewrite with a better CAD kernel.
- Compare a TS-oriented baseline (including existing compiled/WASM kernels where relevant), Rust compiled to WASM, and credible lower-level alternatives such as C/C++ compiled to WASM. Screen other candidates if they satisfy the product constraints; document why a candidate is rejected instead of producing a token comparison. Screen capabilities, licenses and browser/offline suitability first, then benchmark a small justified shortlist rather than every language/kernel/framework combination.
- Compare solid/B-rep and mesh approaches against printing output and genuine STEP CAD export. Evaluate editable downstream geometry separately from recovering original feature history. Measure the complexity cost of STEP and return any scope tradeoff to the user.
- Evaluate pure and hybrid implementations. Account for marshaling/copying, worker scheduling, ownership/lifetimes and browser/WASM boundary costs; do not assume Rust or another lower-level language automatically improves end-to-end performance.
- Preserve static hosting, offline execution after load, independent business modules, versioned portable data, accessible UI and existing user files. Study future curved layouts, battery accommodation and stabilizer extensions through bounded feasibility cases, not full implementation.

**Required evidence and outputs**

1. Survey current primary documentation, licenses, maintenance/activity, browser targets and tooling for plausible languages/frameworks/kernels; identify unavailable capabilities and operational limits.
2. Define the same representative input fixtures and equivalent output quality/tolerances before benchmarking. Include a small handwired layout, a rotated/irregular layout, a split layout and an agreed stress case. Test plate/shell/bottom generation, cutouts, rounding, clearance checks and STL/STEP export; include invalid and near-degenerate geometry. Establish target devices, browsers, memory budgets and acceptable latency before selecting a winner. Correctness is an eligibility check before speed comparisons; hold tessellation quality and geometric tolerance constant. Record repeatability and export metadata behavior, test reopening parameter projects across candidate version updates, and explicitly resolve any byte-determinism conflict with the owning principles before adoption.
3. Build isolated, reproducible comparison prototypes only as part of that research feature. Record candidate versions, source revisions, build options, fixture hashes, hardware/browser details and repeatable measurements. Compare cold startup/download/WASM initialization, warm full and incremental calculations, UI responsiveness, peak memory and growth across repeated edits, transfer overhead, export time/size and geometric correctness. Publish failures and unsupported measurements alongside successes.
4. Exercise cancellation, rapid edits, Undo during work, stale-result rejection, crash/failure recovery and offline packaging. Evaluate threading requirements and hosting compatibility where relevant. Judge determinism, testing/debugging, build/CI complexity, dependency/asset licensing and long-term maintenance as well as speed.
5. Independently review the results for technical, UX and scope weaknesses, revise the recommendation, and discuss material tradeoffs with the user. Produce a comparison matrix, reproducible evidence, known limits and migration/module-boundary proposal.
6. Write a separate final selection ADR stating the chosen language(s), UI framework, renderer, kernel, execution model, dependencies, rejected alternatives and rationale. Link measured evidence; explicitly supersede any affected earlier decisions and update their owning rules when the decision is accepted. No production technology migration starts before this gate.

**Completion.** The research produces a defensible choice and documented tradeoffs, not a preselected Rust implementation or a marketing benchmark. If no candidate satisfies the requirements, report the failed constraints and agree scope changes rather than silently dropping STEP, offline use or independence.

## Future validation — required work, not yet performed

The user requested recording the following technical, physical and beginner checks for future execution. The technology-research feature owns the comparative technical evidence; full physical and beginner validation remain distinct gates before claiming supported product outcomes. Other rows specify investigations needed before committing their corresponding scope.

| Gate | Evidence needed before committing the corresponding product scope |
|---|---|
| Reference assembly and assets | Select exact switches/keycaps/controller and bottom fastening for direct soldering; verify source drawings/models and redistribution provenance; reset access is optional, no PCB/hot swap/stabilizers initially |
| Mechanical feasibility | Print and assemble a complete supported flat reference design; record fit, cable/solder access, disassembly and limits, alongside a local fit sample |
| Technical / technology research | Complete the dedicated comparative feature above, including offline STL/STEP, latency/memory/correctness, recovery/cancellation and current-revision export; publish evidence and a final selection ADR |
| Beginner workflow | Test component selection, enclosure changes, conflict correction and export with a person without CAD experience; review the proposed screen layout in both themes |
| Independent modules | Compare document ownership, persistence, migrations, validation and history options; demonstrate that each module works with no data from the other |
| Interoperability | Specify the accepted two-way workflow: ownership, key identity, units, halves, change/conflict review and preservation of bindings/wiring/mechanical settings; test both directions without losing existing user data |
| Monorepository | Decide package/application boundaries from the above contracts, record required architecture/dependency decisions, then specify migration without changing existing behavior |
| Expanded scope | Add component combinations and split assembly evidence; reassess 3D poses and curved geometry separately rather than treating curvature as a small flat-case option |

No experiments or prototypes listed above have been performed in this documentation task.

## Open decisions to discuss

1. Select exact full-height Gateron, low-profile Gateron and keycap combinations, plus Pro Micro/nice!nano v2/alternative board revisions. KS-33 Low Profile 2.0 and conventional MX-compatible Gateron are accepted families; exact SKUs and keycaps remain open. Which combination should be physically tested first?
2. Which fastening and custom dimensions are necessary within the accepted upper-part/removable-bottom construction? Additional recipes and free part composition remain later proposals.
3. Initial assembly is confirmed direct-solder handwired without PCB, hot swap or stabilizers. Battery and stabilizer support are future extensions; agree their later release allocation, along with curved layouts, tenting and wrist rests. Define initially supported non-1u combinations without implying verified unstabilized wide-key behavior.
4. Can printing output plus genuine STEP solids be delivered without disproportionate complexity? Evaluate before selecting a geometry engine. STEP geometry supports downstream CAD modification but does not promise the original parametric feature history; retain the app project as the editable design source.
5. For the accepted bidirectional layout exchange, how are project pairs and copied/forked documents matched, conflicting edits resolved and incompatible future 3D geometry represented? Transport and conflict-resolution details remain open; one-time-only transfer is insufficient.
6. Do the modules share one shell, have independent entry points, or ship as separate applications? Business independence is confirmed; deployment topology is not.
7. Which traceable online dimension/model sources and exact asset licenses will be used, how will their revisions and physical verification be maintained, and who can print/test the reference assemblies?
8. Agree target hardware/browser performance budgets and the bounded future-complexity cases for the dedicated technology-research feature; actual language/framework/kernel selection follows its evidence and final ADR.

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
