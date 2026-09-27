# 0011. Tailwind CSS v4 as the design system

Status: Accepted
Date: 2026-09-27

## Context
The UI is an admin-panel-style editor: app shell, workspace navigation, forms, tables, dialogs, inspector panels, code preview, SVG canvas. It needs one consistent visual language, light and dark themes, and styling that agents can write without inventing ad-hoc CSS per component. The roadmap left the styling approach open.

## Decision
- Tailwind CSS v4 (`tailwindcss` + `@tailwindcss/vite`, dev dependencies; output is a static CSS file, no runtime JS).
- Design tokens are defined once in `src/styles.css` via `@theme`, as **semantic** names (surface, text, border, accent, danger, …). Each token holds both themes via CSS `light-dark()`; `color-scheme` on `<html>` picks one — System by default, forced by `data-theme="light"|"dark"` (spec 001, research R1).
- Feature code uses only semantic token utilities. Raw palette colors and arbitrary values are not used outside `src/styles.css`.
- Primitives (`Button`, `Field`, `Dialog`, `Table`, …) live in `src/ui/components/`, are built on native elements, and are created when the first feature needs them. Variants are typed maps inside the primitive.
- No component library, no headless UI library, no `clsx` / `tailwind-merge` / `cva`; adding one needs a new ADR.
- Rules: `docs/guidelines/frontend/`. Lint and formatter enforce what they can (class order, conflicts, banned classes).

## Consequences
- One place to change the look (`src/styles.css`); dark mode is free for feature code.
- Dynamic class names (`bg-${color}`) do not work with Tailwind's scanner and are banned.
- Without `tailwind-merge`, primitives accept `className` only for layout (margin, placement, width), never to restyle.
- SVG canvas geometry uses SVG attributes, not utility classes.
