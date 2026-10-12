# Data model

Project remains schemaVersion 4, unchanged. No new serialized state or migration.

`ShieldTarget`: board id, ZMK version, GPIO allowlist, documentation URL (catalog data passed into domain).

`ShieldMatrix`: readonly rowPins:number[], colPins:number[], cells:{row,col}[] in keys-array order, diodeDirection:row2col|col2row. Derived ephemeral value only. Every used net has exactly one distinct allowed GPIO; sets are disjoint; cells unique; both sets nonempty; all switch edges connect opposite colors and currents agree.

`Result<ShieldMatrix, readonly ValidationIssue[]>`: invalid derivation returns problems and no matrix.

`GeneratedFile`: readonly path:string and content:string. Pure generation takes valid Project and ShieldMatrix, returns five files in fixed order; one LF terminator. Files live at boards/shields/<shieldName>/ for this feature; 010 can assemble config/repository support files without changing generator semantics.

`Preset`: readonly bundled Project. Creating a preset returns fresh key/wire/layer objects and binding records; no shared mutable state. New uses existing replace operation, autosave and history. Existing empty New remains available.

Generation-specific ValidationCode additions map to Schematic except layer limits (Bindings). Paths identify key index, wire index/end, name, or layer index/name. Existing issue navigation opens the relevant workspace and parts list/layer. These codes are derived and do not alter schemaVersion.
