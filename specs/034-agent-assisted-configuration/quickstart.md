# Validation guide

1. Run the app using `make up`, open Create with agent using the project-bar button and download the package. Unzip, read README/PROMPT/GUIDE, inspect versions and supported catalogs.
2. Give the files and a keyboard description to your own agent. Supply actual hardware facts or approve proposed choices. No agent execution is part of app verification.
3. Save existing work. Use normal Open and confirm replacement with either bundled example; expect zero Problems, visible keys/bindings and available Export download. Download the ZMK ZIP; inspect keymap/shield files. Edit one key then Undo/Redo and reload.
4. Try malformed/too-new JSON; expect readable rejection and unchanged project. A structurally accepted but invalid electrical project must report Problems and block export.
5. Keyboard-open the dialog, Tab through controls, download, Escape and check opener focus. Repeat at 1024px, desktop 200% zoom, light/dark and reduced motion. A denied download must show retry without changing project/history.
6. Stage explicit changed files and run `npm run check:changed`. Tests and actual commands/results belong to verification.md. Screen-reader/OS acceptance must be recorded separately; do not infer it from browser automation.
