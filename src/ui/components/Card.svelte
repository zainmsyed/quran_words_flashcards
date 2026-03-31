<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { speak, stop as stopSpeak, isSupported as isTtsSupported } from '../../core/tts-adapter';
  import { browserStorage } from '../../core/storage-adapter';
  import type { Word } from '../../core/wordlist';

  export let word: Word;
  export let mode: 'ar2en' | 'en2ar' = 'ar2en';

  const dispatch = createEventDispatcher();
  let flipped = false;
  let speaking = false;
  let ttsAvailable = false;
  let preferredVoice: string | null = null;

  onMount(async () => {
    ttsAvailable = isTtsSupported();
    try { preferredVoice = await browserStorage.getItem<string>('qfc2_tts_voice'); } catch (e) {}
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

  function rate(r: 'hard' | 'got' | 'easy') {
    dispatch('rate', r);
  }

  async function handleTtsClick() {
    if (!ttsAvailable || !word?.arabic) return;
    if (speaking) {
      stopSpeak();
      speaking = false;
      return;
    }
    speaking = true;

    // Try to play a pre-bundled audio file first (public/audio/<id>.mp3)
    const audioUrl = `/audio/${word.id}.mp3`;
    let played = false;
    try {
      // Use HEAD to check existence to avoid loading full file twice
      const resp = await fetch(audioUrl, { method: 'HEAD' });
      if (resp.ok) {
        const a = new Audio(audioUrl);
        try {
          await a.play();
          played = true;
        } catch (e) {
          // if play fails, fall back to TTS
          console.warn('[TTS] audio play failed, falling back to TTS', e);
          played = false;
        }
      }
    } catch (e) {
      // network error or not found — fall back to TTS
    }

    if (!played) {
      try {
        await speak(word.arabic, { lang: 'ar-SA', rate: 0.8, transliteration: word.transliteration, voice: preferredVoice, fallbackLang: 'en-US' });
      } catch (e) {
        // ignore
      }
    }

    speaking = false;
  }
</script>

<div role="button" tabindex="0" aria-label="Flip flashcard" on:click={flip} on:keydown={handleCardKeydown} style="cursor:pointer">
  {#if !flipped}
    <div class="front card">
      {#if mode === 'ar2en'}
        <div class="arabic">
          <div class="arabic-content">
            <div class="arabic-word">{word.arabic}</div>
            {#if word.transliteration}
              <div class="translit">{word.transliteration}</div>
            {/if}
          </div>
          <button class="tts" on:click|stopPropagation={handleTtsClick} aria-label="Pronounce Arabic word" disabled={!ttsAvailable}>
            {#if speaking}Stop{:else}Play{/if}
          </button>
        </div>
      {:else}
        <div class="front-english card">
          <div class="english-front">{word.english}</div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="back card">
      {#if mode === 'ar2en'}
        <div class="english">{word.english}</div>
      {:else}
        <div class="arabic">
          <div class="arabic-content">
            <div class="arabic-word">{word.arabic}</div>
            {#if word.transliteration}
              <div class="translit">{word.transliteration}</div>
            {/if}
          </div>
          <button class="tts" on:click|stopPropagation={handleTtsClick} aria-label="Pronounce Arabic word" disabled={!ttsAvailable}>
            {#if speaking}Stop{:else}Play{/if}
          </button>
        </div>
      {/if}

      <div class="buttons">
        <button on:click|stopPropagation={() => rate('hard')}>Hard</button>
        <button on:click|stopPropagation={() => rate('got')}>Got it</button>
        <button on:click|stopPropagation={() => rate('easy')}>Easy</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .card{padding:18px}
  .arabic{font-size:2rem;text-align:center;direction:rtl;display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Amiri', serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
  .arabic-content{display:flex;flex-direction:column;align-items:center;gap:4px}
  .arabic-word{font-size:2.1rem}
  .translit{font-size:0.95rem;color:#555;font-style:italic}
  .tts{margin-left:8px;border:0;background:transparent;cursor:pointer;font-size:1.1rem}
  .tts[disabled]{opacity:0.4;cursor:default}
  .english{font-size:1.1rem;margin-top:8px}
  .front-english .english-front{font-size:1.6rem;font-weight:400}
  .buttons{display:flex;gap:8px;margin-top:12px}
  button{padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#fff;cursor:pointer}
</style>
