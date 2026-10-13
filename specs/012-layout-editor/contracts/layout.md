# Layout contracts

Table columns: selection, Key (0-based), X (u), Y (u), Width (u), Height (u), Rotation (°), Origin X (u), Origin Y (u), pins and actions. Each input is named Key N <property> (<unit>); defaults shown numerically. Selection checkbox named Select key N. Table and canvas share selection; roving selection rows, ArrowUp/Down, Space, Shift range selection. Editing an input may select its key unless it already belongs to a multi-selection.

Selected-layout Tools controls: batch dimensions/angle/origin and translation; Preview, Apply layout, Cancel preview; Duplicate selected keys, Delete selected keys, Renumber by position. Resize/rotate can be done through numeric tools and table without drag; existing movement drag remains available. Each apply is one undo step. Preview shows in Schematic only, is unsaved, blocks conflicting transient gestures until cancelled/applied, and disappears if the base project changes.

Canvas key arrows navigate visual centers; Shift+arrows nudge selected keys by shared grid size, Mod+Space toggles focused key without clearing other selection. Escape cancels draft first. Pointer drag translates entire rotated cluster including origin, snap follows first key position; collision refusal considers actual polygons. Table numeric edits may overlap and surface key issues.

Physical layout output: <&key_physical_attrs w h x y r rx ry>, each cell independently Math.round(value*100), negatives parenthesized, defaults retain old bytes. Order equals transform cells and keymap bindings. No r=0 origin elision when explicitly supplied. Deterministic, LF and trailing newline.
