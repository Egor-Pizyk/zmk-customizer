import type { PickerItem } from './to-picker-item';

const WORD_PATTERN = /[^a-z0-9]+/u;

function toWords(text: string): readonly string[] {
  return text
    .toLowerCase()
    .split(WORD_PATTERN)
    .filter((word) => word !== '');
}

// Every query word must start a word of the id, name, legend, code or description,
// case-insensitive; order is kept (spec 004 FR-014). So "n" finds N and Number but not
// Print, and "print screen" still finds Print Screen.
export function filterPickerItems(
  items: readonly PickerItem[],
  query: string,
): readonly PickerItem[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return items;
  }
  const queryWords = toWords(needle);
  if (queryWords.length === 0) {
    return items.filter((item) =>
      [item.id, item.name, item.legend].some((text) => text.toLowerCase().includes(needle)),
    );
  }
  return items.filter((item) => {
    const words = [item.id, item.name, item.legend, item.description, ...item.codes].flatMap(
      (text) => toWords(text),
    );
    return queryWords.every((word) => words.some((candidate) => candidate.startsWith(word)));
  });
}
