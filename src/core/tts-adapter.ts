export type TtsOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  // when true (default), if no Arabic voice is available the adapter will attempt
  // to speak an ASCII transliteration so the user still hears an approximation.
  fallbackToTransliteration?: boolean;
  // optional exact voice name to prefer (as reported by SpeechSynthesisVoice.name)
  voice?: string;
  // optional pre-provided transliteration (prefer this over automatic transliteration)
  transliteration?: string;
  // when using transliteration fallback, prefer this language (e.g. 'en-US')
  fallbackLang?: string;
  // optional bundled/local audio candidates to try before Web Speech
  audioSources?: string[];
};

let activeAudio: HTMLAudioElement | null = null;

function hasSpeechSupport(): boolean {
  if (typeof window === 'undefined') return false;
  const synth = (window as any).speechSynthesis;
  const Utterance = (window as any).SpeechSynthesisUtterance;
  return Boolean(synth && typeof synth.speak === 'function' && typeof Utterance === 'function');
}

function hasAudioSupport(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}

async function tryPlayAudioSource(source: string): Promise<boolean> {
  if (!source || !hasAudioSupport()) return false;

  try {
    const audio = new Audio(source);
    audio.preload = 'auto';
    activeAudio = audio;

    return await new Promise<boolean>((resolve) => {
      let settled = false;

      const cleanup = () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('error', handleError);
      };

      const finish = (played: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (activeAudio === audio) activeAudio = null;
        resolve(played);
      };

      const handleEnded = () => finish(true);
      const handlePause = () => finish(true);
      const handleError = () => finish(false);

      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('error', handleError);

      try {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => finish(false));
        }
      } catch (err) {
        finish(false);
      }
    });
  } catch (err) {
    if (activeAudio) activeAudio = null;
    return false;
  }
}

async function tryPlayBundledAudio(sources?: string[]): Promise<boolean> {
  const candidates = (sources || []).filter(Boolean);
  if (candidates.length === 0) return false;

  for (const source of candidates) {
    const played = await tryPlayAudioSource(source);
    if (played) return true;
  }

  return false;
}

function voicesLoaded(timeout = 3000): Promise<any[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve([]);
    const synth = (window as any).speechSynthesis;
    if (!synth) return resolve([]);
    let voices = synth.getVoices && synth.getVoices();
    if (voices && voices.length > 0) return resolve(voices);

    const handler = () => {
      voices = synth.getVoices && synth.getVoices();
      synth.removeEventListener('voiceschanged', handler);
      resolve(voices || []);
    };

    synth.addEventListener('voiceschanged', handler);

    // fallback: timeout
    setTimeout(() => {
      try { synth.removeEventListener('voiceschanged', handler); } catch (e) {}
      const v = synth.getVoices && synth.getVoices();
      resolve(v || []);
    }, timeout);
  });
}

export async function getAvailableVoices(): Promise<{name: string; lang: string; default?: boolean}[]> {
  if (typeof window === 'undefined') return [];
  const voices = await voicesLoaded(3000);
  return (voices || []).map((v: any) => ({ name: v.name, lang: v.lang, default: !!v.default }));
}

export function isSupported(): boolean {
  return hasSpeechSupport() || hasAudioSupport();
}

export function stop(): void {
  if (typeof window === 'undefined') return;
  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
  } catch (e) {
    // ignore
  }

  try {
    const synth = (window as any).speechSynthesis;
    if (synth && typeof synth.cancel === 'function') synth.cancel();
  } catch (e) {
    // ignore
  }
}

// Basic Arabic -> Latin approximation. Not a full transliteration system but good enough
// as an audible fallback when no Arabic voice is installed in the browser.
function transliterateArabic(input: string): string {
  if (!input) return '';

  // quick special-case for the most common word
  if (input.indexOf('الله') !== -1) {
    return input.replace(/الله/g, 'Allah');
  }

  const map: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
    'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w',
    'ي': 'y', 'ى': 'a', 'ة': 'a', 'ء': '\'', 'ؤ': 'u', 'ئ': 'i', 'ﻻ': 'la'
  };

  const diacritics: Record<string, string> = {
    '\u064B': 'an', '\u064C': 'in', '\u064D': 'un', '\u064E': 'a', '\u064F': 'u', '\u0650': 'i', '\u0652': '', '\u0670': 'a'
  };
  const shadda = '\u0651';

  const tokens: string[] = [];
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === String.fromCharCode(0x0651)) { // shadda
      // duplicate previous token's last character (best-effort)
      if (tokens.length > 0) {
        const last = tokens.pop() || '';
        const dup = last + (last[last.length - 1] || '');
        tokens.push(dup);
      }
      continue;
    }
    if (diacritics[ch]) {
      tokens.push(diacritics[ch]);
      continue;
    }
    if (map[ch]) {
      tokens.push(map[ch]);
      continue;
    }
    if (/\s/.test(ch)) tokens.push(' ');
    // ignore punctuation and unknown chars
  }

  // insert a short vowel 'a' between consecutive consonant clusters where no vowel present
  const isVowelStart = (t: string) => /^[aeiouAEIOU]/.test(t);
  const parts: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    parts.push(t);
    const next = tokens[i + 1];
    if (next && next !== ' ' && !isVowelStart(t) && !isVowelStart(next)) {
      // add a short vowel to improve pronounceability
      parts.push('a');
    }
  }

  let out = parts.join('');
  out = out.replace(/\s+/g, ' ').trim();
  if (out === '') return input;
  return out;
}

export async function speak(text: string, opts?: TtsOptions): Promise<void> {
  if (!isSupported()) return;

  try {
    stop();

    const playedBundledAudio = await tryPlayBundledAudio(opts?.audioSources);
    if (playedBundledAudio) return;
    if (!hasSpeechSupport()) return;

    const synth = (window as any).speechSynthesis;
    const Utterance = (window as any).SpeechSynthesisUtterance;

    const voices = await voicesLoaded(3000);
    try { console.debug('[TTS] available voices:', voices.map((v: any) => `${v.name} (${v.lang})`)); } catch (e) {}

    const u = new Utterance(text);
    if (typeof opts?.rate === 'number') u.rate = opts.rate;
    if (typeof opts?.pitch === 'number') u.pitch = opts.pitch;
    if (typeof opts?.volume === 'number') u.volume = opts.volume;

    // pick a recommended voice
    let chosen: any = undefined;
    if (voices && voices.length > 0) {
      const lang = (opts && opts.lang) ? opts.lang.toLowerCase() : '';
      if (opts?.voice) {
        chosen = voices.find((v: any) => v.name === opts.voice);
      }
      if (!chosen && lang) chosen = voices.find((v: any) => v.lang && v.lang.toLowerCase().startsWith(lang));
      if (!chosen) chosen = voices.find((v: any) => v.lang && v.lang.toLowerCase().startsWith('ar'));
      if (!chosen) chosen = voices.find((v: any) => v.default) || voices[0];
    }

    // If the text contains Arabic and we do not have an Arabic voice, fall back to a transliteration
    const containsArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u.test(text || '');
    const chosenLangIsArabic = chosen && chosen.lang && chosen.lang.toLowerCase().startsWith('ar');
    const useTranslit = opts && typeof opts.fallbackToTransliteration === 'boolean' ? opts.fallbackToTransliteration : true;

    if (containsArabic && !chosenLangIsArabic && useTranslit) {
      const translit = (opts && opts.transliteration) ? opts.transliteration : transliterateArabic(text);
      try {
        u.text = translit;
        // prefer an English voice for transliteration
        let english = voices.find((v: any) => v.lang && v.lang.toLowerCase().startsWith('en'));
        const voiceToUse = english || chosen;
        if (voiceToUse) {
          try { u.voice = voiceToUse; } catch (e) {}
          try { u.lang = voiceToUse.lang || (opts && opts.fallbackLang) || 'en-US'; } catch (e) {}
        } else {
          try { u.lang = (opts && opts.fallbackLang) || 'en-US'; } catch (e) {}
        }
        console.debug('[TTS] transliteration fallback used:', translit);
      } catch (e) {}
    } else {
      // use original Arabic text and chosen voice if present
      try { u.text = text; } catch (e) {}
      if (chosen) {
        try { u.voice = chosen; } catch (e) {}
        if (!opts?.lang && chosen && chosen.lang) {
          try { u.lang = chosen.lang; } catch (e) {}
        }
      } else if (opts?.lang) {
        try { u.lang = opts.lang; } catch (e) {}
      }
    }

    return await new Promise<void>((resolve) => {
      u.onend = () => resolve();
      u.onerror = (ev: any) => { console.warn('[TTS] utterance error', ev); resolve(); };
      try { synth.cancel(); } catch (e) {}
      try { synth.speak(u); } catch (e) { console.warn('[TTS] speak failed', e); resolve(); }
    });
  } catch (e) {
    console.warn('[TTS] speak exception', e);
    return;
  }
}
