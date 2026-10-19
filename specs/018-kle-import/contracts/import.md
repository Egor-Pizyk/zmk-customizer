# KLE import contracts

parseKleLayout(text) → Result<{ geometries: readonly KeyGeometry[], warnings: readonly string[] }, string>. Decode only JSON, validate with zod, reject structural/type/finite/positive-size/budget failures with readable locations. Warning order is deterministic, deduplicated; unsupported property names are plain text. readKleFile(File) adds pre-read byte limits and converts read failure to a message.

replaceProjectLayout(project, geometries) → Project: pure/immutable, deterministic k0… IDs, preserve name/controller, derive shield name (drop any explicit override), use createProject defaults for other content. Empty or over-budget layout returns original identity.

Review state includes base project identity. File selection and cancellation supersede older requests. Any intervening project change permanently invalidates pending reads/review, even if Undo returns to the same identity. Apply checks latest Project before committing. The apply button explicitly names replacement and the review lists every reset category.
