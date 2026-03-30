export type Word = {
  id: string;
  arabic: string;
  transliteration?: string;
  english: string;
};

// Small seeded data for the scaffold. Later this module should load a build-time JSON
// converted from .context/intake/dictionaries/quran_300_words.csv or parse CSV in-browser.
import seed from '../data/seed-words.json';

// Normalize transliteration to a simple ASCII approximation suitable for browser TTS
function normalizeTransliteration(s?: string): string | undefined {
  if (!s) return undefined;
  // Decompose then map common IPA/diacritic characters to ASCII
  const map: Record<string, string> = {
    '\u0101': 'a', // ā
    'ā': 'a', 'Ā': 'A',
    'ī': 'i', 'Ī': 'I', '\u012B': 'i',
    'ū': 'u', 'Ū': 'U',
    'ḥ': 'h', 'Ḥ': 'H',
    'ṣ': 's', 'Ṣ': 'S',
    'ḍ': 'd', 'Ḍ': 'D',
    'ṭ': 't', 'Ṭ': 'T',
    'ẓ': 'z', 'Ẓ': 'Z',
    'ġ': 'gh', 'ḫ': 'kh',
    'ʿ': "'", 'ʾ': "'", 'ʼ': "'", '’': "'", '‘': "'", 'ˈ': "'",
    '\u0304': '', // combining macron
    '\u0306': '', // combining breve
    '\u0430': 'a' // cyrillic small a (fix accidental Cyrillic letters)
  };

  // Normalize to NFKD to separate diacritics, then map
  let out = s.normalize('NFKD');
  let res = '';
  for (const ch of out) {
    if (map[ch] !== undefined) res += map[ch];
    else {
      const code = ch.charCodeAt(0);
      // skip combining diacritic marks
      if (code >= 0x0300 && code <= 0x036F) continue;
      // keep ASCII letters, digits, spaces and common punctuation
      if (/^[\u0000-\u007F]$/.test(ch)) res += ch;
      else {
        // Fallback: try to strip typical diacritics by removing non-Latin
        // For a small number of unexpected characters (Cyrillic) map a few common ones:
        if (ch === '\u0435') res += 'e';
        else if (ch === '\u043E') res += 'o';
        else if (ch === '\u0441') res += 's';
        else res += ch;
      }
    }
  }

  // Post-process: remove any remaining characters outside [A-Za-z0-9' -]
  res = res.replace(/[^A-Za-z0-9'\-\s,.]/g, '');
  res = res.replace(/\s+/g, ' ').trim();
  return res || undefined;
}

export async function loadSeedWords(): Promise<Word[]> {
  const data = seed as Array<any>;
  return data.map((item) => ({
    id: item.id,
    arabic: item.arabic,
    transliteration: normalizeTransliteration(item.transliteration || item.tr || item.trn || ''),
    english: item.english
  }));
}
