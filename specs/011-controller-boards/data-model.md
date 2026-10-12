# Data model

Project: schemaVersion literal 5; required controllerId is one of the catalog ids. Existing fields unchanged.

ControllerBoard: id string, name, family (`pro_micro` or `seeed_xiao`), connector (`pro_micro` or `xiao_d`), gpioPins, pins ({index,label,mcu}), reservedContacts, description, docsUrl. GPIO indices unique, pin labels include board-specific silk/aliases and Dn connector indices; nice!nano analog aliases are not reused on RP2040, only verified connector entries. Immutable catalog.

Free WireEnd: existing kind/at, optional boardPin integer 0–31 representing selected connector position; optional droppedBoardPin nonempty string up to 160 characters; both cannot coexist. Schema accepts unavailable indices so domain validation can explain imported assignments; unknown controller ids are rejected at trust boundary.

Transitions: change controller → same id returns identical project; same family preserves existing available pins; other pins become unassigned with previous board/name label; previous dropped metadata is preserved. Assignment/explicit clear removes droppedBoardPin. All operations create one history step, preserving other fields.

Migration: v1→v2→v3→v4→v5. v4 has no controllerId/droppedBoardPin; validate old shape before mapping, not by accepting newly introduced fields. Default nice_nano_v2. Map exposed raw gpio0 to connector index; other valid raw values become dropped labels. Geometry unchanged. Malformed old values remain rejected.
