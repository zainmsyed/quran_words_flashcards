<script lang="ts">
  import { onMount } from 'svelte';
  import type { Word } from '../../core/wordlist';
  import { browserStorage } from '../../core/storage-adapter';
  import { speak, stop, isSupported } from '../../core/tts-adapter';

  export let word: Word;
  export let mode: 'ar2en' | 'en2ar' = 'ar2en';

  const STORAGE_VOICE_KEY = 'qfc2_tts_voice';

  let flipped = false;
  let speaking = false;
  let ttsAvailable = false;
  let preferredVoice: string | null = null;

  onMount(async () => {
    ttsAvailable = isSupported();
    try {
      preferredVoice = await browserStorage.getItem<string>(STORAGE_VOICE_KEY);
    } catch (err) {
      preferredVoice = null;
    }
  });

  function flip() {
    flipped = !flipped;
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      flip();
    }
  }

  async function handleTtsClick(e?: MouseEvent) {
    if (!ttsAvailable || !word?.arabic) return;
    if (speaking) {
      try { stop(); } catch (err) {}
      speaking = false;
      return;
    }
    speaking = true;
    try {
      await speak(word.arabic, {
        lang: 'ar-SA',
        rate: 0.9,
        voice: preferredVoice || undefined,
        transliteration: word.transliteration,
        fallbackLang: 'en-US',
        audioSources: [
          `/audio/${word.id}.mp3`,
          `/audio/gcp/${word.id}.mp3`
        ]
      });
    } catch (e) {
      // ignore
    }
    speaking = false;
  }
</script>

<div class="flashcard-scene">
  <div
    role="button"
    tabindex="0"
    aria-label="Flip flashcard"
    class:flipped
    class="flashcard"
    on:click={flip}
    on:keydown={handleCardKeydown}
  >
    <div class="card-face front">
      {#if mode === 'ar2en'}
        <button class="audio-btn" type="button" aria-pressed={speaking} aria-label={speaking ? 'Stop pronunciation' : 'Pronounce Arabic'} on:click|stopPropagation={handleTtsClick} disabled={!ttsAvailable}>
          {#if speaking}
            <svg class="audio-icon stop" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>
          {:else}
            <svg class="audio-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.75V13.25H8L12.5 17.75V6.25L8 10.75H4Z" fill="currentColor"/><path d="M15.25 8.75C16.36 9.86 16.36 14.14 15.25 15.25" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M17.75 6.25C19.61 8.11 19.61 15.89 17.75 17.75" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          {/if}
        </button>
      {/if}
      {#if mode === 'ar2en'}
        <div class="card-core front-core">
          <div class="center-zone">
            <div class="arabic-text">{word.arabic}</div>
          </div>
          {#if word.transliteration}
            <div class="transliteration">{word.transliteration}</div>
          {/if}
          <div class="flip-hint">
            <span class="flip-symbol">↺</span>
            <span>tap card to flip</span>
          </div>
        </div>
      {:else}
        <div class="card-core front-core">
          <div class="center-zone">
            <div class="english-text">{word.english}</div>
          </div>
          <div class="flip-hint">
            <span class="flip-symbol">↺</span>
            <span>tap card to flip</span>
          </div>
        </div>
      {/if}
    </div>

    <div class="card-face back">
      {#if mode === 'en2ar'}
        <button class="audio-btn" type="button" aria-pressed={speaking} aria-label={speaking ? 'Stop pronunciation' : 'Pronounce Arabic'} on:click|stopPropagation={handleTtsClick} disabled={!ttsAvailable}>
          {#if speaking}
            <svg class="audio-icon stop" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>
          {:else}
            <svg class="audio-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.75V13.25H8L12.5 17.75V6.25L8 10.75H4Z" fill="currentColor"/><path d="M15.25 8.75C16.36 9.86 16.36 14.14 15.25 15.25" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M17.75 6.25C19.61 8.11 19.61 15.89 17.75 17.75" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          {/if}
        </button>
      {/if}
      {#if mode === 'ar2en'}
        <div class="card-core back-core">
          <div class="english-text">{word.english}</div>
        </div>
      {:else}
        <div class="card-core back-core">
          <div class="arabic-text">{word.arabic}</div>
          {#if word.transliteration}
            <div class="transliteration">{word.transliteration}</div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .flashcard-scene {
    perspective: 1200px;
    width: 100%;
    display: flex;
    justify-content: center;
    margin-inline: auto;
  }

  .flashcard {
    position: relative;
    width: 100%;
    min-height: 60vh;
    transform-style: preserve-3d;
    -webkit-transform-style: preserve-3d;
    transition: transform 0.52s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 6px;
    cursor: pointer;
    box-shadow: var(--shadow-primary);
  }

  .flashcard:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 4px;
  }

  .flashcard.flipped {
    transform: rotateY(180deg);
  }

  .card-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 6px;
    background: var(--card);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(1.15rem, 3vw, 1.5rem);
    text-align: center;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
    pointer-events: none;
    font-family: 'Work Sans', sans-serif;
    color: var(--text);
  }

  .audio-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 3rem;
    height: 3rem;
    border-radius: 6px;
    border: 0.5px solid var(--border);
    display: grid;
    place-items: center;
    padding: 0;
    background: var(--card);
    color: var(--primary);
    cursor: pointer;
    box-shadow: var(--shadow-primary);
    transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s, transform 0.15s;
  }

  .audio-btn:hover {
    background: var(--primary-container);
    border-color: rgba(214, 40, 40, 0.18);
    opacity: 1;
    transform: translateY(-1px);
  }

  .audio-btn:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 3px;
  }

  .audio-btn[aria-pressed='true'] {
    background: var(--primary);
    color: var(--on-primary);
    border-color: var(--primary);
  }

  .audio-btn[disabled] { opacity: 0.45; cursor: default; transform: none; }

  .audio-icon {
    width: 22px;
    height: 22px;
    display: block;
    margin: 0 auto;
  }

  .audio-icon.stop {
    width: 18px;
    height: 18px;
  }

  .card-face.front {
    z-index: 2;
  }

  .card-face.back {
    transform: rotateY(180deg);
  }

  .flashcard:not(.flipped) .card-face.front,
  .flashcard.flipped .card-face.back {
    pointer-events: auto;
  }

  .card-core {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .front-core {
    padding: 0.35rem 0.25rem;
  }

  .back-core {
    justify-content: center;
  }

  .card-mode-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.78rem;
    line-height: 1;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    font-weight: 800;
  }

  .center-zone {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 0.7rem;
    min-height: 0;
    /* allow absolute-positioning of hints/transliteration without affecting Arabic centering */
    position: relative;
  }

  .arabic-text {
    font-family: 'Noto Naskh Arabic', serif;
    font-size: clamp(52px, 10vw, 96px);
    line-height: 1.08;
    color: var(--text);
    direction: rtl;
    display: flex;
    align-items: center;
    justify-content: center;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  .english-text {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(30px, 8vw, 48px);
    line-height: 1.08;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.04em;
  }

  .transliteration {
    font-family: 'Work Sans', sans-serif;
    font-size: 1rem;
    color: var(--text-secondary);
    font-style: italic;
    line-height: 1.3;
    font-weight: 500;
  }

  /* place transliteration below centered Arabic without overlapping */
  .card-face.front .transliteration {
    margin-top: 0.45rem;
    text-align: center;
  }

  @media (max-width: 520px) {
    .card-face.front .transliteration {
      margin-top: 0.35rem;
    }
  }

  .flip-hint {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.78rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    font-weight: 700;
    padding-top: 0.2rem;
  }

  .flip-symbol {
    display: inline-grid;
    place-items: center;
    width: 1rem;
    height: 1rem;
    font-size: 12px;
    line-height: 1;
  }

  @media (max-width: 520px) {
    .flashcard {
      width: 100%;
      min-height: 60vh;
    }

    .card-face {
      padding: 1rem;
    }

    .audio-btn {
      top: 0.85rem;
      right: 0.85rem;
      width: 2.75rem;
      height: 2.75rem;
    }

    .audio-icon {
      width: 20px;
      height: 20px;
    }

    .audio-icon.stop {
      width: 16px;
      height: 16px;
    }

    .arabic-text {
      font-size: 56px;
    }

    .english-text {
      font-size: 24px;
    }
  }
</style>
