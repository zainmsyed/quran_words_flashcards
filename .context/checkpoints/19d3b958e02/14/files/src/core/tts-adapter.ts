export type TtsOptions = {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
};

export function isSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const synth = (window as any).speechSynthesis;
  const Utterance = (window as any).SpeechSynthesisUtterance;
  return Boolean(synth && typeof synth.speak === 'function' && typeof Utterance === 'function');
}

export function stop(): void {
  if (typeof window === 'undefined') return;
  try {
    const synth = (window as any).speechSynthesis;
    if (synth && typeof synth.cancel === 'function') synth.cancel();
  } catch (e) {
    // ignore
  }
}

export function speak(text: string, opts?: TtsOptions): Promise<void> {
  return new Promise((resolve) => {
    if (!isSupported()) {
      resolve();
      return;
    }

    try {
      const synth = (window as any).speechSynthesis;
      const Utterance = (window as any).SpeechSynthesisUtterance;
      const u = new Utterance(text);

      if (opts?.lang) u.lang = opts.lang;
      if (typeof opts?.rate === 'number') u.rate = opts.rate;
      if (typeof opts?.pitch === 'number') u.pitch = opts.pitch;
      if (typeof opts?.volume === 'number') u.volume = opts.volume;

      u.onend = () => resolve();
      u.onerror = () => resolve();

      try { synth.cancel(); } catch (e) {}
      synth.speak(u);
    } catch (e) {
      resolve();
    }
  });
}
