# Repository fixture provenance and differences

Authored before 010 generator implementation using approved 009 unibody goldens (see ../unibody/DIFFERENCES.md) and docs/zmk/shield-files.md §1–2/6. Official unified-zmk-config-template pin: 09fce009cdf2f38fc3ae786e24c95b22cf78c79a, https://github.com/zmkfirmware/unified-zmk-config-template/tree/09fce009cdf2f38fc3ae786e24c95b22cf78c79a.

- Retain shield default keymap and copy to config as editable user keymap.
- Move empty user conf from shield directory to config; no hardware user settings in shield conf.
- Add single nice_nano_v2/unibody_six entry to template build.yaml instead of comments.
- Module and west structures match documented official template. Workflow triggers are compact inline YAML; release remains v0.3 in both refs.
- No .gitkeep or empty directories in export. No outer zmk-config directory.

These independently authored expectations are not generator snapshots or proof of firmware compilation.
