// Deterministic text normalization and literal matching for prohibited-item rules (no regular expressions
// from rule data, so a pathological rule cannot slow evaluation).

// Look-alike letters (Cyrillic, Greek) and common digit substitutions mapped to the Latin letter they imitate.
const LOOKALIKES: Readonly<Record<string, string>> = {
  'а': 'a', 'в': 'b', 'е': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's', 'һ': 'h', 'ԁ': 'd',
  'α': 'a', 'β': 'b', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ν': 'v', 'ο': 'o', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x', 'ɡ': 'g', 'ӏ': 'l',
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't',
};
const FORMAT = /\p{Cf}/gu;
const CONTROL = /\p{Cc}/gu;
const MARKS = /\p{M}/gu;
const SEPARATORS = /[^\p{L}\p{N}]+/gu;

/**
 * NFKC, strip zero-width and control characters, case-fold, strip diacritics, map look-alikes, then reduce
 * every run of non-letter/non-digit characters to one space. The result is a space-separated token string.
 */
export function normalizeText(input: string): string {
  const folded = input.normalize('NFKC').replace(FORMAT, '').replace(CONTROL, ' ').toLowerCase().replace(/ß/gu, 'ss').replace(/[ςſ]/gu, (c) => (c === 'ς' ? 'σ' : 's'));
  const plain = folded.normalize('NFD').replace(MARKS, '');
  let mapped = '';
  for (const ch of plain) mapped += LOOKALIKES[ch] ?? ch;
  return mapped.replace(SEPARATORS, ' ').trim();
}

export interface Haystack {
  /** Fields normalized and joined with " | "; a phrase never contains "|", so no match spans two fields. */
  readonly text: string;
  readonly padded: string;
  readonly tokens: ReadonlySet<string>;
  readonly fields: readonly (readonly string[])[];
}

export function buildHaystack(fields: readonly string[]): Haystack {
  const normalized = fields.map(normalizeText).filter((f) => f.length > 0);
  const text = normalized.join(' | ');
  return { text, padded: ` ${text} `, tokens: new Set(text.split(' ')), fields: normalized.map((f) => f.split(' ')) };
}

export function matchesPhrase(h: Haystack, phrase: string, mode: 'whole_word' | 'phrase'): boolean {
  if (phrase.length === 0) return false;
  if (mode === 'phrase') return h.text.includes(phrase);
  return phrase.includes(' ') ? h.padded.includes(` ${phrase} `) : h.tokens.has(phrase);
}

/** Every run of exactly `n` consecutive tokens inside one field, as normalized phrases. */
export function* ngrams(h: Haystack, n: number): Generator<string> {
  for (const tokens of h.fields) for (let i = 0; i + n <= tokens.length; i++) yield tokens.slice(i, i + n).join(' ');
}
