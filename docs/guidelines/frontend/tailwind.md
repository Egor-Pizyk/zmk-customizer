---
description: Tailwind v4 tokens only — no arbitrary values, no style prop; token source is src/styles.css.
paths:
  - src/**/*.tsx
  - src/styles.css
---

# Tailwind

Tailwind CSS v4 is the design system (ADR 0011). Tokens live only in `src/styles.css` (`@theme`); that file is the source of truth for token names. Screen patterns: `admin-ui.md`. Contrast and focus requirements: `accessibility.md`.

## Tokens only

- Colors come from semantic tokens: `bg-surface`, `bg-surface-muted`, `bg-surface-raised`, `border-border` (decorative dividers only, below 3:1), `border-border-strong` (input and control edges, ≥3:1), `text-text`, `text-text-muted`, `bg-accent` + `text-accent-contrast`, `text-danger`, `text-warning`, `text-success`, `outline-focus`. SVG uses the same tokens: `fill-surface-raised`, `stroke-border`, `stroke-danger`.
- The default palette, radii and fonts are cleared in `@theme`, so `bg-gray-500` or `rounded-xl` produce no CSS. Treat them as errors, not as "unused".
- No arbitrary values in feature code: `w-[137px]`, `text-[#333]`, `grid-cols-[1fr_2fr]`, `top-[3px]`. Need a value that does not exist → add a token to `src/styles.css` in the same change, then use its utility. Arbitrary *variants* on attributes (`aria-[current=page]:`) are allowed when no built-in variant exists; use the canonical form lint suggests (`aria-invalid:`, not `aria-[invalid=true]:`).
- Spacing, sizing and type scale are Tailwind defaults (`p-2`, `gap-3`, `h-8`, `text-sm`). Do not add spacing tokens.
- Dynamic user-resized widths in ActionPanel and SchematicEditorPanel use CSSOM sizing (scoped lint exceptions); visual styling stays in tokens/classes.
- No `style` prop for looks. SVG geometry (`x`, `y`, `width`, `height`, `transform`) is SVG attributes computed from `u`, never classes and never `style`.

```tsx
// ✅
<rect x={xPx} y={yPx} width={widthPx} height={heightPx} rx={4} className="fill-surface-raised stroke-border group-aria-selected:stroke-accent" />
<p className="text-sm text-text-muted">Keys are numbered in keymap order.</p>

// ❌
<rect className="fill-white stroke-gray-300" style={{ transform: `translate(${xPx}px)` }} />
<p className="text-[13px] text-[#666]">…</p>
```

## Dark mode

- Each token holds its light and dark value via `light-dark()` in `src/styles.css`; the theme (System / Light / Dark) is picked by `color-scheme` on `<html>` (`data-theme`). Feature code never writes `dark:`; if something looks wrong in dark mode, fix the token.

## Variants in primitives

- A primitive's variants are a typed `Record` of complete class strings. The scanner only sees literal class names, so classes are never built from props.

```tsx
// ✅ components/button.tsx
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANT_CLASSES = {
  primary: 'bg-accent text-accent-contrast hover:opacity-90',
  secondary: 'border border-border bg-surface-raised text-text hover:bg-surface-muted',
  ghost: 'text-text hover:bg-surface-muted',
  danger: 'bg-danger text-accent-contrast hover:opacity-90',
} as const satisfies Record<ButtonVariant, string>;

// ❌ invisible to Tailwind, unbounded input
<button className={`bg-${color}-500 px-${size}`} />
```

- `className` on a primitive is for placement only: margin, `grid-*`/`col-span-*`/`flex-*` placement, `w-*`/`max-w-*`, `self-*`. Never color, padding, border, radius, font. Without `tailwind-merge` a conflicting class wins by CSS order, not by position in the string, so "overriding" is unreliable. Need a different look → add a variant.

```tsx
// ✅
<Button variant="danger" className="ml-auto">Delete layer</Button>
// ❌
<Button className="bg-danger px-6 text-lg">Delete layer</Button>
```

## Conditional classes

- Prefer state variants driven by the attribute that already carries the state: `aria-selected:`, `aria-pressed:`, `aria-expanded:`, `aria-[current=page]:`, `disabled:`, `user-invalid:`, `aria-invalid:`, `data-conflict:` (v4 matches `[data-conflict]`), `group-*` / `peer-*`. The ARIA attribute is needed for accessibility anyway; the style follows it for free.
- When a JS condition is unavoidable: one ternary, or `[…].filter(Boolean).join(' ')` inline. No helper library, no `cn()` util.

```tsx
// ✅
<button aria-current={isCurrent ? 'page' : undefined} className="aria-[current=page]:bg-surface-muted">
<tr data-selected={isSelected || undefined} className="data-selected:bg-surface-muted">
<g data-conflict={hasConflict || undefined} className="group data-conflict:stroke-danger">
<span className={isSplit ? 'col-span-1' : 'col-span-2'}>

// ❌ state duplicated into a class, nested ternary
<tr className={isSelected ? 'bg-surface-muted' : ''}>
<g className={hasConflict ? 'stroke-danger' : isSelected ? 'stroke-accent' : 'stroke-border'}>
```

## Interaction states

- Every interactive element has a visible focus ring from the `focus` token: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`. Primitives carry it; feature code that renders its own interactive element (SVG key, table row control) adds it. Never `outline-none` without a replacement.
- SVG keys show focus with a stroke: `group-focus-visible:stroke-focus` on the key's `<rect>`, `group` on the focusable `<g>`.
- `hover:` never carries information that focus or selection lacks.
- Motion only as `motion-safe:transition-colors`; no animation that conveys state (`accessibility.md`).

## Layout and responsiveness

- Desktop admin layout. Designed at 1280px, must work at 1024px wide. Phones are not a target.
- Base (unprefixed) classes are the narrow layout: the tab bar stays as a narrow icon column (labels in tooltips); `lg:` (1024px) widens it and shows labels; `<main>` scrolls (`min-w-0 overflow-auto`); `xl:` may dock the inspector beside the canvas instead of below. No `sm:` / `md:` in feature code.
- The canvas, the matrix grid and wide tables scroll inside their own `overflow-auto` container; the page itself never scrolls horizontally.
- Layout via `grid` / `flex` + `gap-*`. No `space-x-*` with wrapping content, no floats.

## `@apply` and long class lists

- `@apply` only in the base layer of `src/styles.css` for element defaults (`body`, `code`, `kbd`). Never in feature code, never to make "component classes".
- A class list repeated in two places, or one longer than about a dozen utilities with a clear name → extract a primitive in `components/`. One long list used once stays inline.
- Class order is the formatter's job; do not hand-sort or review order.

## Enforced by

- Formatter (oxfmt `sortTailwindcss`): class order.
- Lint (`eslint-plugin-better-tailwindcss` via oxlint `jsPlugins`, `src/**/*.tsx`): unknown classes (raw palette colors are unknown because the default palette is cleared), conflicting, duplicate, deprecated, non-canonical and non-shorthand classes, concatenated class names (`` `p-${n}` ``), and restricted classes: `dark:`, `sm:`, `md:`, `outline-none`/`outline-hidden`, arbitrary values and properties, `(--var)` classes.
- Lint (oxlint react): `style` prop banned (`react/forbid-dom-props`); `forwardRef`, `FC`, `ProjectContext.Provider` banned.
- Review: placement-only `className`, variants as typed maps, tokens added before use, `border-border-strong` on input edges.

### Feature 033 panel exception

For Schematic editing panels and app Settings, apply the [033 narrow-viewport exception](admin-ui.md#feature-033-panel-exception), including 390px support and canvas/panel budgets.
