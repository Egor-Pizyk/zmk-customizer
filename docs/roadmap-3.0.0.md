# Roadmap — 3.0.0

Status: discovery draft, 2026-10-26. Target release: **3.0.0**, selected by the user for the keycap-generator idea. This records a possible future capability and references, not an approved implementation plan. No feature numbers are reserved. The [first-major roadmap](roadmap.md) and [2.0.0 mechanical roadmap](roadmap-2.0.0.md) retain their scope.

## Candidate — keycap generator

Explore designing printable custom keycaps and complete sets for a keyboard layout. Possible controls include size/profile, text or SVG legends, legend placement and colors, with a 3D preview and multi-part 3MF export for multi-color printing. Consider reusable legend templates and batch generation from the keyboard's layout; importing bindings as suggested legends must remain an explicit, reviewable choice.

These are scope proposals for later specification. Decide whether the initial product customizes existing base models or generates parametric keycap geometry; the reference projects do not establish the feasibility of arbitrary profiles or switch mounts. Standalone use, exchange with the firmware/mechanical modules, exact profiles and switch compatibility, supported sizes, custom model import, shine-through and export formats remain to be agreed.

## Reference review

Reviewed public READMEs, repository inventories and selected source files on 2026-10-26. The applications were not run, exports were not opened in slicers, and no parts were printed.

### Vostok Labs — Keycap Legend Generator

- [User-supplied application](https://vostoklabs.github.io/SVG-keycap-generator/). The original GitHub repository URL currently redirects to [SVG-keycap-generator-OLD](https://github.com/vostoklabs/SVG-keycap-generator-OLD); review pinned at [`c09cdd4`](https://github.com/vostoklabs/SVG-keycap-generator-OLD/tree/c09cdd46407da06a1a80324db71041970aa11bfc).
- The [README](https://github.com/vostoklabs/SVG-keycap-generator-OLD/blob/c09cdd46407da06a1a80324db71041970aa11bfc/README.md) describes browser-based legend customization, several keycap sizes, text/SVG/icons, font import, placement controls, shine-through and two-color 3MF. Base meshes are preconverted from STEP; source STEP files are not included.
- Useful reference: a focused single-key flow with direct legend manipulation and separate cap/legend materials. The [3MF exporter](https://github.com/vostoklabs/SVG-keycap-generator-OLD/blob/c09cdd46407da06a1a80324db71041970aa11bfc/src/export3mf.js) illustrates grouped parts and slicer-specific filament metadata; its [Manifold integration](https://github.com/vostoklabs/SVG-keycap-generator-OLD/blob/c09cdd46407da06a1a80324db71041970aa11bfc/src/manifold.js) separates indexed export geometry from preview shading.
- Reuse boundary: code and models are marked [CC BY-NC-ND 4.0](https://github.com/vostoklabs/SVG-keycap-generator-OLD/blob/c09cdd46407da06a1a80324db71041970aa11bfc/LICENSE.md). Treat this as a product/interaction reference; no code or asset adoption is approved. Fonts and icons have separate credits and terms.

### srwi — keycap_generator

- [Repository](https://github.com/srwi/keycap_generator), [application](https://srwi.github.io/keycap_generator/); review pinned at [`c1c12c8`](https://github.com/srwi/keycap_generator/tree/c1c12c85685e9db81f80d64c4d27b21a4f22fc6a).
- The [README](https://github.com/srwi/keycap_generator/blob/c1c12c85685e9db81f80d64c4d27b21a4f22fc6a/README.md) separates base STL models, reusable legend templates and individual keys. It describes custom STL upload and multi-color 3MF output.
- Useful reference: reuse geometry and legend placement across a set instead of editing every key independently. Its [manifest](https://github.com/srwi/keycap_generator/blob/c1c12c85685e9db81f80d64c4d27b21a4f22fc6a/package.json) lists Svelte, Three.js, Manifold, OpenType and export libraries; this is an implementation example, not a technology recommendation for this project.
- No repository-wide license was found in the reviewed tree, and GitHub reports no detected license. Do not assume permission to copy code or bundled models. Resolve permissions and each asset's provenance before any adoption; a bundled font license does not cover the application.

## Questions and gates before implementation

- Choose the first end-to-end scenario: one decorated keycap or a layout-sized set; select exact base geometry, profiles, stems and manufacturing method. Do not infer physical compatibility from nominal `u` sizes or an MX-style cross alone.
- Establish rights and provenance for base models, fonts and icons. Keep imported SVG/font/STL parsing within untrusted-input boundaries and define size/complexity limits.
- Evaluate browser/offline geometry and export feasibility under the existing principles. Both references use mesh workflows; neither establishes editable STEP export or approves a shared engine with 2.0.0. New dependencies and technology decisions follow the existing ADR process.
- Specify editable project persistence, migrations, Undo/Redo, accessible alternatives to 3D manipulation, layout exchange and deterministic output before production work.
- Verify export units, part/material identity and slicer import with representative files. Print fit samples and a representative keycap/set before claiming supported stem fit, legend quality or shine-through. Wide keys need explicit stabilizer and clearance decisions.

Documentation verification: repository revisions and source links were inspected; this entry changes no runtime behavior, schema or onboarding flow. Physical, browser and slicer checks above are future work.
