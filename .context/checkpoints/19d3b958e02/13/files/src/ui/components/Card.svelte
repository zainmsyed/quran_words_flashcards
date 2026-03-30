<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { speak, stop as stopSpeak, isSupported as isTtsSupported } from '../../core/tts-adapter';
  export let word: { id: string; arabic: string; english: string; verse?: string; ref?: string };
  const dispatch = createEventDispatcher();
  let flipped = false;
  let speaking = false;
  let ttsAvailable = false;

  onMount(() => {
    ttsAvailable = isTtsSupported();
  });

  function flip() {
    flipped = !flipped;
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
    try {
      await speak(word.arabic, { lang: 'ar-SA', rate: 0.8 });
    } catch (e) {
      // ignore
    }
    speaking = false;
  }
</script>

<div on:click={flip} style="cursor:pointer">
  {#if !flipped}
    <div class="front card">
      <div class="arabic">
        {word.arabic}
        <button class="tts" on:click|stopPropagation={handleTtsClick} aria-label="Pronounce Arabic word" disabled={!ttsAvailable}>
          {#if speaking}Stop{else}Play{/if}
        </button>
      </div>
    </div>
  {:else}
    <div class="back card">
      <div class="english">{word.english}</div>
      {#if word.verse}
        <div class="verse">{word.verse} — <small>{word.ref}</small></div>
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
  .arabic{font-size:2rem;text-align:center;direction:rtl;display:flex;align-items:center;justify-content:center;gap:8px}
  .tts{margin-left:8px;border:0;background:transparent;cursor:pointer;font-size:1.1rem}
  .tts[disabled]{opacity:0.4;cursor:default}
  .english{font-size:1.1rem;margin-top:8px}
  .verse{margin-top:8px;color:#444}
  .buttons{display:flex;gap:8px;margin-top:12px}
  button{padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#fff;cursor:pointer}
</style>
