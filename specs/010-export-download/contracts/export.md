# Export contract

Default ZIP filename: <shield-name>-zmk-config.zip. No outer directory.
Default paths (10): .github/workflows/build.yml; boards/shields/<name>/Kconfig.defconfig; boards/shields/<name>/Kconfig.shield; boards/shields/<name>/<name>.keymap; boards/shields/<name>/<name>.overlay; build.yaml; config/<name>.conf; config/<name>.keymap; config/west.yml; zephyr/module.yml.

There are 10 default files and 9 without workflow.

Manifest remote is https://github.com/zmkfirmware, project zmk imports app/west.yml, self path config. Module build.settings.board_root is '.'. Build include entry uses catalog boardId and project shield name. Workflow triggers push, pull_request, workflow_dispatch and calls pinned reusable workflow. No shield conf remains in the repository composition.

Preview equals archive path/content set. Each file has accessible Copy <path> and Download <path> names. ZIP disabled semantics and hint name the validation count. Pending shows Building zip… and aria-busy. Checkbox has label Include GitHub Actions workflow, explanatory text and documentation link. Copy/download failures visible and announced; retry allowed. Existing polite StatusMessage announces via announce(). Single-file downloads preserve UTF-8 with MIME text/plain and basename. JSON project downloads retain application/json.
