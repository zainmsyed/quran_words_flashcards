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
        <div class="card-core front-core">
          <div class="card-mode-label">arabic → english</div>

          <div class="center-zone">
            <div class="arabic-text">{word.arabic}</div>
            {#if word.transliteration}
              <div class="transliteration">{word.transliteration}</div>
            {/if}
          </div>

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
    min-height:var(--card-height);
    transform-style:preserve-3d;
    -webkit-transform-style:preserve-3d;
    transition:transform 0.55s cubic-bezier(0.4,0,0.2,1);
    border-radius:var(--radius-xl);
    cursor:pointer;
    box-shadow:0 16px 42px rgba(0,109,75,0.08);
  }
  .flashcard.flipped{transform:rotateY(180deg)}
  .card-face{
    position:absolute;
    inset:0;
    backface-visibility:hidden;
    -webkit-backface-visibility:hidden;
    border-radius:var(--radius-xl);
    border:0.5px solid rgba(173, 179, 181, 0.14);
    background:var(--card);
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    padding:2.4rem 1.65rem;
    text-align:center;
    box-shadow:var(--shadow-primary);
    /* default: ignore pointer events so only the visible face receives clicks */
    pointer-events: none;
    z-index: 1;
  }
  .card-face.front{ z-index: 2; }
  .card-face.back{
    transform:rotateY(180deg);
    background:linear-gradient(180deg, var(--surface-container-low), var(--surface-container-lowest));
  }
  /* enable pointer events only for the visible face */
  .flashcard:not(.flipped) .card-face.front,
  .flashcard.flipped .card-face.back {
    pointer-events: auto;
  }
  .card-core{
    width:100%;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:8px;
    min-height:0;
  }
  /* increase spacing on the front face specifically so the Arabic sits clearly between the label and transliteration */
  .card-face.front .card-core{
    gap:1.25rem;
    height:100%;
  }
  .back-core{justify-content:space-between}
  .card-mode-label{
    font-size:11px;
    letter-spacing:0.18em;
    text-transform:uppercase;
    color:var(--text-tertiary);
    /* increased spacing above the Arabic text for clearer separation */
    margin-bottom:1rem;
    font-weight:800;
  }
  .arabic-text{
    font-family:'Amiri', serif;
    /* responsive, larger Arabic display */
    font-size: clamp(48px, 10vw, 120px);
    line-height: 1.2;
    color:var(--primary);
    direction:rtl;
    /* center the Arabic vertically between the label and the transliteration */
    margin-top: auto;
    margin-bottom: auto;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .transliteration{
    margin-top:0.6rem;
    font-size:15px;
    color:var(--text-secondary);
    font-style:italic;
  }
  .english-text{
    font-size:30px;
    font-weight:700;
    color:var(--text);
    line-height:1.2;
    font-family:'Manrope', sans-serif;
  }
  .audio-row{display:flex;align-items:center;justify-content:center;margin-top:10px}
  .audio-btn{
    background:var(--surface-container-low);
    border:0.5px solid rgba(173, 179, 181, 0.14);
    border-radius:999px;
    cursor:pointer;
    color:var(--text-secondary);
    padding:0.55rem 0.95rem;
    font-size:13px;
    font-family:'Inter', sans-serif;
    font-weight:700;
    transition:opacity 0.15s, transform 0.15s;
  }
  .audio-btn:hover{opacity:0.85;transform:translateY(-1px)}
  .buttons{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:10px;width:100%;margin-top:18px}
  .buttons button{
    padding:0.9rem 0.75rem;
    border-radius:999px;
    border:0.5px solid rgba(173, 179, 181, 0.14);
    font-size:13px;
    font-weight:800;
    cursor:pointer;
    font-family:'Inter', sans-serif;
    letter-spacing:0.01em;
    transition:opacity 0.15s, transform 0.15s, box-shadow 0.15s;
    background:var(--card);
    color:var(--text);
    box-shadow:var(--shadow-primary);
  }
  .buttons button:hover{opacity:0.92;transform:translateY(-1px)}
  .buttons button:first-child{border-color:rgba(173, 179, 181, 0.16);color:var(--text-secondary);background:var(--surface-container-low)}
  .buttons button:nth-child(2){border-color:rgba(0, 109, 75, 0.12);color:var(--primary);background:var(--primary-container)}
  .buttons button:nth-child(3){border-color:var(--primary);color:var(--on-primary);background:linear-gradient(135deg, var(--primary), var(--primary-dim))}

  /* center-zone: keep the Arabic visually centered between the label above and the transliteration below */
  .card-core.front-core{height:100%;display:flex;flex-direction:column}
  .center-zone{position:relative;flex:1 1 auto;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:0 0.5rem}
  .center-zone .arabic-text{position:relative;z-index:2}
  .center-zone .transliteration{position:absolute;bottom:10px;left:0;right:0;text-align:center;z-index:1;color:var(--text-secondary);font-size:15px;font-style:italic}

  @media (max-width: 520px){
    .flashcard{min-height:var(--card-height)}
    .arabic-text{font-size:50px}
    .english-text{font-size:24px}
    .buttons{grid-template-columns:1fr;}
  }
</style>
