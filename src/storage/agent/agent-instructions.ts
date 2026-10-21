export const AGENT_PROMPT = `# Create a keyboard project

You are helping me create a NEW ZMK Customizer keyboard project from scratch.
Read README.md, GUIDE.md, manifest.json, project.schema.json, catalogs.json and
both examples before producing output. Use only this package's supported features
and pinned ZMK version. Do not substitute current ZMK main documentation.

Ask for my keyboard description and clarify missing hardware facts: controller,
unibody/split, number and positions of keys, dimensions/rotations, electrical
matrix or direct wiring, actual pins and diode direction. If hardware is undecided,
propose a concrete configuration and get my explicit approval before using it.
Never present proposed pins or automatic routing as detected physical wiring.
Ask about desired bindings, layers and firmware settings. Include supported
encoders, custom behaviors, combos, macros or conditional layers only when requested.
If my request is unsupported, explain the limit and ask how to proceed; do not
invent catalog identifiers, arbitrary Kconfig options or new Project fields.

Create the complete Project JSON: geometry/halves, selected controller,
real schematic wires and terminals, diodes where needed, bindings/layers and
requested supported firmware settings. Matrix cells alone do not establish wires.
Use the schema for exact shapes and examples for working electrical relationships.
Check identities, references, GPIO capacity/conflicts, diode polarity, supported
keycodes, layer/behavior/macro references and resource limits. Do not claim that
structural JSON Schema validation proves electrical validity.

Return a standalone UTF-8 project.json containing only valid Project JSON, without
markdown fences, comments or prose. In a separate message, list confirmed hardware
facts, approved proposals, pin/diode wiring to review, limitations and validation
steps. If you cannot create files, provide one JSON block for me to save as
project.json and put all explanations outside it. Do not provide raw ZMK as the
import artifact. Do not modify an existing project: that is outside this flow.

Tell me to Save my current work, use Open and confirm replacement, review Schematic,
Bindings, Firmware and Problems, repair issues, then review Export and download.
If import is rejected, ask me for the displayed field paths/messages and repair
the JSON, preserving the agreed configuration. If the package is from another app
version, ask for a fresh package rather than guessing. Never bypass validation.
Successful import/export does not establish firmware compilation or hardware operation.

My keyboard description:
[Describe the keyboard and hardware you have, or ask me the questions above.]
`;

export const AGENT_GUIDE = `# Project semantics and review

## Format and geometry

Use the schemaVersion in manifest.json. Project is one JSON object; omit absent
optional fields rather than using null. The schema is generated from the app's
current parser, but custom refinements and domain checks are not all expressible
in JSON Schema. The normal Open importer and Problems/Export checks are authoritative.
Stay within catalogs.json budgets (including byte and wire-segment limits).

keys array order is the stable exported key-index order. IDs are unique within
their collection: k0 keys, w0 wires, l0 layers, t0 terminals; use the schema's
patterns for other IDs. References must name existing entities. Geometry uses
keyboard units (1u = 19.05 mm pitch); xU/yU position the upper-left corner before
rotation, widthU/heightU default to 1, rotationDeg is clockwise and optional
rotationOriginXU/rotationOriginYU describe the rotation pivot. Preserve the
relative geometry and split half labels from the chosen design. Names have
separate display/technical constraints; review Problems before export.

## Electrical graph, not just matrix coordinates

Use wiring.kind matrix or direct and supported wiring.topology. BLE split uses
the same supported BLE controller on both halves, left central/right peripheral.
Each key's half and each terminal's half must agree with its physical controller.
Pins are connector numbers from the selected controller's gpioPins, not MCU
numbers or positions in an array. GND, power and reserved contacts are not GPIOs.
A GPIO can be reused across different halves but cannot be assigned to conflicting
circuits on the same half, including encoder A/B pins.

wiring.terminals are ordered row/col (matrix) or input/ground (direct) terminals.
Their order within a half/kind determines row/column positions. A free wire end
uses terminalId to refer to one of these terminals; the terminal owns boardPin.
Do not also put boardPin on a terminalId end. Ground terminals never have boardPin.
Every switch must actually connect through wires to its intended circuits;
no synthetic cells array can replace the graph. A matrix key joins exactly one
row and one column through its two pins and a diode. Direct mode joins one input
and ground per key. Study complete examples before changing their graph.

Switch pin positions are derived from switch center, not keycap corners: on an
unrotated 1u key at (0,0), pin 1 is (0.3,0.3667) and pin 2 is (0.6333,0.2333).
The catalog geometry examples are computed from current domain geometry. For a
resized key, offset by half its width/height from the top-left, then add the
pin offsets relative to the 1u center; rotate the resulting point clockwise
around the key rotation origin (defaults to key center), rounding to 4 decimals.
Wire paths insert a horizontal-first elbow when consecutive points are diagonal;
explicit bends should be chosen to avoid unintended crossings and contacts.

Wire ends use kind key-pin with keyId/pin (1 or 2), free with at and optional
terminalId, or junction referencing another wire at a point on it. Bends are
orthogonal points in u. Wire crossings connect by default unless recorded in
insulatedCrossings with ascending wire IDs and the correct crossing ordinal.
Avoid unrelated crossings, shorts and wires touching unintended switch pins.

For matrix col2row the diode cathode is on the row side; row2col puts it on the
column side. key.diode.pin chooses the switch pin holding the diode, and cathode
toward-switch/away-switch must match actual wiring. The examples use proposed
col2row wiring; do not assume this matches my hardware.

Durable intermediate key-pin attachments are explicit: wire.contacts stores
keyId, pin and at; alternatively contactIds indexes Project.wireContacts. Use
one representation consistently and keep references valid. wire.anchors records
fixed spine endpoints when key movement needs leads. Missing contacts does not
mean that moving a key will create new intermediate attachments. Do not fabricate
pooled references or rely on accidental geometry to preserve a bus after movement.
Wire routes, anchors and attachments must agree. The app rejects malformed or
inconsistent contacts. Prefer clear direct endpoints for newly authored circuits.

## Bindings, firmware and requested advanced features

layers are ordered; layer 0 is the base. Bindings are keyed by key ID, never by
array index; missing bindings mean none. Use supported keycode names/aliases from
catalogs.json and unique modifiers in LC LS LA LG RC RS RA RG order. Layer bindings
refer to layer IDs, not numeric ZMK layer positions. Respect the semantic layer
limit even if the structural parser permits more for repair. Use custom behavior,
macro, combo and conditional-layer definitions only as requested; references must
exist and behavior/macro expansion must not recurse. Conditional targets follow
their inputs. Refer to source-derived schema/catalog limits for exact shapes.

firmware is a dictionary of typed overrides keyed by option id from the catalog.
Omit defaults; use the catalog's value types, ranges, choices, prerequisites and
board applicability. Do not insert raw Kconfig lines. Encoders use supported A/B
GPIOs, half, steps and triggersPerRotation; their push switches are ordinary keys.
Encoder actions are per-layer encoderBindings with existing action shapes.

## Import, repair and export

Save current work before Open: confirmed replacement resets Undo/Redo history.
Invalid JSON, unsupported future schema, malformed references and oversized files
are rejected without changing the current project. Read the named field paths,
repair the artifact with the agent and retry. A file accepted structurally can
still show Problems for unsupported values, electrical conflicts or missing data.
Review those in Schematic/Bindings/Firmware and repair before Export is available.
Subsequent ordinary edits support Undo/Redo, autosave and project-file round trips.

Inspect every proposed GPIO/diode connection against actual hardware. Preview and
download the ZMK configuration in Export. Successful validation is not firmware compilation or proof of hardware operation. Build and flash externally using the
export instructions. The app never executes the AI, sends the package to a service,
or applies agent output automatically. Existing-project editing and MCP are outside
this initial creation workflow.
`;
