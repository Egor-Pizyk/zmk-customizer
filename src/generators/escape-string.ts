// Kconfig expands $(...) inside quoted strings; \$ cancels expansion (pinned kconfiglib).
export function escapeString(text: string, format: 'devicetree' | 'kconfig'): string {
  const escaped = text.replaceAll('\\', String.raw`\\`).replaceAll('"', String.raw`\"`);
  return format === 'kconfig' ? escaped.replaceAll('$', String.raw`\$`) : escaped;
}
