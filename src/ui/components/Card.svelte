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

    const audioUrl = `/audio/${word.id}.mp3`;
    let played = false;
    try {
      const resp = await fetch(audioUrl, { method: 'HEAD' });
      if (resp.ok) {
        const a = new Audio(audioUrl);
        try {
          await a.play();
          played = true;
        } catch (e) {
          console.warn('[TTS] audio play failed, falling back to TTS', e);
          played = false;
        }
      }
    } catch (e) {
      // fall back to TTS
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
        <div class="card-core">
          <div class="card-mode-label">arabic → english</div>
          <div class="arabic-text">{word.arabic}</div>
          {#if word.transliteration}
            <div class="transliteration">{word.transliteration}</div>
          {/if}
          <div class="audio-row">
            <button class="audio-btn" type="button" on:click|stopPropagation={handleTtsClick} aria-label="Pronounce Arabic word" disabled={!ttsAvailable}>
              {#if speaking}Stop{:else}Pronounce{/if}
            </button>
          </div>
        </div>
      {:else}
        <div class="card-core">
          <div class="card-mode-label">english → arabic</div>
          <div class="english-text">{word.english}</div>
        </div>
      {/if}
    </div>

    <div class="card-face back">
      {#if mode === 'ar2en'}
        <div class="card-core back-core">
          <div class="card-mode-label">meaning</div>
          <div class="english-text">{word.english}</div>
          <div class="buttons">
            <button type="button" on:click|stopPropagation={() => rate('hard')}>Hard</button>
            <button type="button" on:click|stopPropagation={() => rate('got')}>Got it</button>
            <button type="button" on:click|stopPropagation={() => rate('easy')}>Easy</button>
          </div>
        </div>
      {:else}
        <div class="card-core back-core">
          <div class="card-mode-label">arabic</div>
          <div class="arabic-text">{word.arabic}</div>
          {#if word.transliteration}
            <div class="transliteration">{word.transliteration}</div>
          {/if}
          <div class="audio-row">
            <button class="audio-btn" type="button" on:click|stopPropagation={handleTtsClick} aria-label="Pronounce Arabic word" disabled={!ttsAvailable}>
              {#if speaking}Stop{:else}Pronounce{/if}
            </button>
          </div>
          <div class="buttons">
            <button type="button" on:click|stopPropagation={() => rate('hard')}>Hard</button>
            <button type="button" on:click|stopPropagation={() => rate('got')}>Got it</button>
            <button type="button" on:click|stopPropagation={() => rate('easy')}>Easy</button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .flashcard-scene{perspective:1200px;width:100%;margin-bottom:1rem}
  .flashcard{
    position:relative;
    width:100%;
    min-height:300px;
    transform-style:preserve-3d;
    transition:transform 0.5s cubic-bezier(0.4,0,0.2,1);
    border-radius:var(--radius-lg);
    cursor:pointer;
  }
  .flashcard.flipped{transform:rotateY(180deg)}
  .card-face{
    position:absolute;
    inset:0;
    backface-visibility:hidden;
    border-radius:var(--radius-lg);
    border:0.5px solid var(--border);
    background:var(--bg);
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    padding:2rem 1.5rem;
    text-align:center;
  }
  .card-face.back{
    transform:rotateY(180deg);
    background:var(--bg-secondary);
  }
  .card-core{
    width:100%;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:6px;
    min-height:0;
  }
  .back-core{justify-content:space-between}
  .card-mode-label{
    font-size:11px;
    letter-spacing:0.1em;
    text-transform:uppercase;
    color:var(--text-tertiary);
    margin-bottom:0.5rem;
  }
  .arabic-text{
    font-family:'Amiri', serif;
    font-size:54px;
    line-height:1.3;
    color:var(--text);
    direction:rtl;
    margin-bottom:0.1rem;
  }
  .transliteration{
    font-size:14px;
    color:var(--text-secondary);
    font-style:italic;
  }
  .english-text{
    font-size:26px;
    font-weight:300;
    color:var(--text);
    line-height:1.35;
  }
  .audio-row{display:flex;align-items:center;justify-content:center;margin-top:8px}
  .audio-btn{
    background:none;
    border:0.5px solid var(--border);
    border-radius:20px;
    cursor:pointer;
    color:var(--text-secondary);
    padding:4px 12px;
    font-size:13px;
    font-family:'Lato', sans-serif;
    transition:opacity 0.15s;
  }
  .audio-btn:hover{opacity:0.65}
  .buttons{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:8px;width:100%;margin-top:14px}
  .buttons button{
    padding:10px 6px;
    border-radius:var(--radius-md);
    border:0.5px solid var(--border-md);
    font-size:13px;
    font-weight:700;
    cursor:pointer;
    font-family:'Lato', sans-serif;
    transition:opacity 0.15s;
    background:var(--bg);
    color:var(--text);
  }
  .buttons button:hover{opacity:0.75}
  .buttons button:first-child{border-color:var(--danger-text);color:var(--danger-text);background:var(--danger-bg)}
  .buttons button:nth-child(2){border-color:var(--warn-text);color:var(--warn-text);background:var(--warn-bg)}
  .buttons button:nth-child(3){border-color:var(--success-text);color:var(--success-text);background:var(--success-bg)}
  @media (max-width: 520px){
    .flashcard{min-height:280px}
    .arabic-text{font-size:44px}
    .english-text{font-size:22px}
    .buttons{grid-template-columns:1fr;}
  }
</style>
