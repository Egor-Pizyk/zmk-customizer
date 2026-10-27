# Routing and UI contract

Matrix Rebuild replaces managed key nets only. Preserve terminals/GPIO allocation and selected grid/cells; other editing operations retain their contracts. Accept only if getNets proves each requested key-pin belongs to its one intended terminal with no alien contact/encoder. Geometry stays orthogonal and finite; budgets enforced atomically. One output endpoint per used terminal, two blocks per half. Rows align horizontally 1u above the top key bound, with upward labels and output leads that start upward without sideways escape. Columns align vertically 1u outside the side key bound; outward means left for unibody/left half, right for right half. Obstacles move each block away from keys independently.

UI: existing Rebuild/preview summary/Apply/Cancel/Undo; text describes trees and two grouped outputs. Keyboard and themes unchanged; same explanation in onboarding wiring step. No new controls or motion.

Straight-line refinement: connect aligned unobstructed contacts directly before routing output leads. Perpendicular insulated crossings do not justify a detour in an otherwise straight local line. Reject positive-length collinear overlap for all wires, including same-net wires; joins at a shared key contact remain intentional.
