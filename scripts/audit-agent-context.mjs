import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const STARTUP = [
  'AGENTS.md',
  'docs/product.md',
  'docs/principles.md',
  'docs/workflow.md',
  'docs/agent-rules.md',
];

function findMarkdown(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return findMarkdown(file);
    return entry.isFile() && file.endsWith('.md') ? [file] : [];
  });
}

// A source-size audit, not a tokenizer or a general CommonMark validator.
export function auditDocuments(documents, { exists, root }) {
  const files = [];
  const missingLinks = [];
  const paragraphs = new Map();
  for (const [file, source] of documents) {
    files.push({
      file,
      words: source.trim().split(/\s+/u).filter(Boolean).length,
      bytes: Buffer.byteLength(source),
    });
    const prose = source.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gmu, '');
    for (const match of prose.matchAll(/\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/gu)) {
      const target = match[1].replace(/^<|>$/gu, '').split('#')[0];
      if (!target || /^(?:[a-z][a-z\d+.-]*:|\/)/iu.test(target)) continue;
      try {
        const destination = path.resolve(root, path.dirname(file), decodeURIComponent(target));
        if (!exists(destination)) missingLinks.push({ file, target });
      } catch {
        missingLinks.push({ file, target });
      }
    }
    for (const paragraph of prose.split(/\n\s*\n/u)) {
      const normalized = paragraph.trim().replace(/\s+/gu, ' ');
      if (normalized.split(' ').length < 35) continue;
      const owners = paragraphs.get(normalized) ?? new Set();
      owners.add(file);
      paragraphs.set(normalized, owners);
    }
  }
  return {
    startupWords: files
      .filter(({ file }) => STARTUP.includes(file))
      .reduce((sum, file) => sum + file.words, 0),
    totalWords: files.reduce((sum, file) => sum + file.words, 0),
    files: files.toSorted(
      (left, right) => right.words - left.words || left.file.localeCompare(right.file),
    ),
    missingLinks,
    repeatedParagraphs: [...paragraphs]
      .filter(([, owners]) => owners.size > 1)
      .map(([text, owners]) => ({ words: text.split(' ').length, files: [...owners] })),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.some((argument) => !['--json', '--help'].includes(argument))) {
    process.stderr.write('Usage: node scripts/audit-agent-context.mjs [--json|--help]\n');
    process.exitCode = 2;
  } else if (argumentsList.includes('--help')) {
    process.stdout.write(
      'Audit startup, guidelines, project skills/references, agent adapters and Spec Kit templates. Reports words, local inline Markdown links and exact repeated prose (35+ words). No remote access or writes. --json emits the complete report.\n',
    );
  } else {
    const directories = [
      'docs/guidelines',
      '.claude/skills',
      '.claude/agents',
      '.specify/templates',
      '.specify/references',
    ];
    const selected = new Set([...STARTUP, 'CLAUDE.md', '.specify/memory/constitution.md']);
    for (const directory of directories) {
      for (const file of findMarkdown(path.join(ROOT, directory)))
        selected.add(path.relative(ROOT, file));
    }
    const documents = new Map(
      [...selected].map((file) => [file, readFileSync(path.join(ROOT, file), 'utf8')]),
    );
    const report = auditDocuments(documents, { exists: existsSync, root: ROOT });
    if (argumentsList.includes('--json'))
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    else {
      process.stdout.write(
        `Startup: ${report.startupWords} words; routed corpus: ${report.totalWords} words in ${report.files.length} files. These are not token counts.\nLargest files:\n`,
      );
      for (const file of report.files.slice(0, 8))
        process.stdout.write(`  ${file.words} ${file.file}\n`);
      process.stdout.write(
        `Missing local inline-link targets: ${report.missingLinks.length}; repeated prose groups: ${report.repeatedParagraphs.length}.\n`,
      );
      for (const link of report.missingLinks)
        process.stdout.write(`  ${link.file} -> ${link.target}\n`);
    }
    process.exitCode = report.missingLinks.length ? 1 : 0;
  }
}
