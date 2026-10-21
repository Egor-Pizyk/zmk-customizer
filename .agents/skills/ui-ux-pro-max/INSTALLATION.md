# Project installation

Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
Pinned revision: `56ea9cf174ed86786187daa9de0e6247cb0747e4`
Upstream path: `.claude/skills/ui-ux-pro-max/`
License: [MIT](LICENSE).

Installed with the Codex skill-installer helper, then moved into the project-local
`.agents/skills/ui-ux-pro-max/` directory for Codex discovery.
This is a real directory, not a symlink. There is no Claude Code or global installation.
Local adaptation: the search example in SKILL.md uses an explicit project path
instead of CLAUDE_PLUGIN_ROOT, because this is a repository skill, not a plugin.
Replace `/absolute/path/to/project` with the checkout path. From the repository root:

```sh
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "keyboard navigation" --domain ux
```

Python 3 is required; search uses only the standard library and local data.
Repository rules, existing design tokens and approved dependencies govern changes;
search results are recommendations. Do not introduce runtime network requests,
remote fonts, packages or a replacement design system merely because results suggest them.
For updates, reinstall from an explicitly selected revision, retain the license,
reapply the documented path adaptation and verify local search and project-local discovery.
