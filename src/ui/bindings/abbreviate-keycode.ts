// Short unique legends for keycodes whose name does not fit the keycap (spec 004 FR-007):
// the leading prefix through an underscore, then the rest merged without separators
// ("C_ACRF", "KP_PRNT"). Only names longer than the legend cap reach this; everything else
// keeps its derived legend. Keycode ids are uppercase ASCII, so lengths are plain lengths.
const VOWEL_PATTERN = /[AEIOU]/gu;
const MAX_ABBREVIATION_LENGTH = 7;
const MAX_PREFIX_LENGTH = 4;

function skeleton(word: string): string {
  return word.replace(VOWEL_PATTERN, '');
}

function abbreviationFor(name: string): string {
  const parts = name.split('_');
  if (parts.length === 1) {
    return skeleton(name).slice(0, MAX_ABBREVIATION_LENGTH);
  }
  const twoSegments = `${parts[0]}_${parts[1]}`;
  const keepsTwoSegments = twoSegments.length <= MAX_PREFIX_LENGTH;
  const prefix = keepsTwoSegments ? twoSegments : (parts.at(0) ?? '').slice(0, 2);
  const remaining = parts.slice(keepsTwoSegments ? 2 : 1);
  if (remaining.length === 0) {
    return prefix;
  }
  const last = remaining.at(-1) ?? '';
  const budget = MAX_ABBREVIATION_LENGTH - prefix.length - 1;
  // Middle initials first, so KP_LEFT/RIGHT_PARENTHESIS stay distinct (KP_LPRN/KP_RPRN).
  const tail = `${remaining
    .slice(0, -1)
    .map((part) => part.charAt(0))
    .join('')}${skeleton(last)}`.slice(0, budget);
  const separator = prefix.includes('_') ? '' : '_';
  return `${prefix}${separator}${tail}`;
}

function uniqueAbbreviation(name: string, taken: ReadonlySet<string>): string {
  const base = abbreviationFor(name);
  if (!taken.has(base)) {
    return base;
  }
  for (let digit = 2; digit <= 9; digit += 1) {
    const candidate =
      base.length < MAX_ABBREVIATION_LENGTH
        ? `${base}${digit}`
        : `${base.slice(0, MAX_ABBREVIATION_LENGTH - 1)}${digit}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
  return base;
}

// One legend per name, resolved in sorted order so the output is deterministic.
export function abbreviateKeycodeNames(names: readonly string[]): ReadonlyMap<string, string> {
  const legends = new Map<string, string>();
  const taken = new Set<string>();
  for (const name of [...names].toSorted()) {
    const legend = uniqueAbbreviation(name, taken);
    taken.add(legend);
    legends.set(name, legend);
  }
  return legends;
}
