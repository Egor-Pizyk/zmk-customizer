# KLE interchange research

Date: 2026-10-18. Primary source inspected: [KLE serial.js](https://github.com/ijprest/keyboard-layout-editor/blob/master/serial.js), deserialize implementation.

Decision: accept exported JSON, use an independent small decoder, add no dependency. Existing zod validates known field types. Permissive raw editor syntax is excluded because it is not JSON.

Geometry semantics: row offsets accumulate; width/height reset per key; rotation persists. Either rotation origin property resets both cursor coordinates to the cluster origin, before relative offsets. End of row advances y and resets x to rotation origin x. Rotation properties are restricted to entry zero. Decals consume cursor space but are not physical switches.

Alternatives: a new KLE library adds runtime dependency/ADR and includes appearance features outside scope; guessing cursor rules loses rotated layouts. Legends/styles are warned rather than mapped to actions. Primary rectangle approximation is explicit in review.
