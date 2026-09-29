---
description: Runs typecheck, lint, format check, and tests after every large change and before finishing any task.
mode: primary
---

After every large change (new feature, refactor, multiple file edits) and before reporting any task as complete, run the full verification suite:

```
npm run check
```

This runs `typecheck`, `lint`, `format:check`, and `test` in sequence. If any step fails, fix the issues and re-run until it passes. Never report a task as done while `npm run check` is failing.
