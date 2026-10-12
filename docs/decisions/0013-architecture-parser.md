# ADR 0013: Parser for repository architecture gates

Status: accepted. Date: 2026-10-12.

Use @babel/parser as an explicit development dependency for AST checks in scripts. TypeScript 7 in this repository provides the native compiler, not the createSourceFile JavaScript API. Regex checks cannot reliably distinguish imports/re-exports, normalized paths, type-only edges or aliased global access. The parser already exists transitively through build tooling; declaring it directly prevents relying on an incidental dependency. It never ships in the static app and adds no runtime dependency.

Keep checks in small repository scripts with positive and negative fixtures; no service framework or new lint framework. Parser failures fail the gate instead of silently skipping files.
