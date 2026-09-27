# 0008. SVG layout editor with keyboard-accessible table

Status: Accepted
Date: 2026-09-27

## Context
The layout editor shows up to a few hundred rotated rectangles with labels and selection. It must be keyboard reachable and usable with a screen reader (AGENTS.md §7.8). No drawing library is approved.

## Decision
Render the layout, matrix and keymap views as SVG elements from React, not `<canvas>`. Every key property and operation is also available in a table/list view editing the same project value.

## Consequences
- Keys are DOM nodes: focus, ARIA labels, hit testing and CSS styling come from the browser.
- Rotation maps directly to SVG `transform` with the same `r, rx, ry` values ZMK's physical layout uses.
- Performance is fine at keyboard scale; a canvas would only be reconsidered at thousands of elements.
- Every canvas interaction needs a table or keyboard equivalent before a feature is done.
