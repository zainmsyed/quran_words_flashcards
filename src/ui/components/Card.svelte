<script lang="ts">
  import type { Word } from '../../core/wordlist';

  export let word: Word;
  export let mode: 'ar2en' | 'en2ar' = 'ar2en';

  let flipped = false;

  function flip() {
    flipped = !flipped;
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      flip();
    }
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
          <div class="flip-hint">
            <span class="flip-symbol">↺</span>
            <span>tap card to flip</span>
          </div>
        </div>
      {:else}
        <div class="card-core front-core">
          <div class="card-mode-label">english → arabic</div>
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
      {#if mode === 'ar2en'}
        <div class="card-core back-core">
          <div class="card-mode-label">meaning</div>
          <div class="english-text">{word.english}</div>
          {#if word.transliteration}
            <div class="transliteration">{word.transliteration}</div>
          {/if}
        </div>
      {:else}
        <div class="card-core back-core">
          <div class="card-mode-label">arabic</div>
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
    border-radius: 24px;
    cursor: pointer;
    box-shadow: 0 12px 24px rgba(23, 78, 58, 0.06);
  }

  .flashcard.flipped {
    transform: rotateY(180deg);
  }

  .card-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border-radius: 24px;
    border: 1px solid rgba(214, 237, 229, 0.95);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(250, 252, 251, 0.99));
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.35rem 1.15rem;
    text-align: center;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.62),
      0 12px 24px rgba(17, 63, 48, 0.04);
    pointer-events: none;
  }

  .card-face.front {
    z-index: 2;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(251, 253, 252, 0.99));
  }

  .card-face.back {
    transform: rotateY(180deg);
    background:
      linear-gradient(180deg, rgba(250, 253, 251, 0.99), rgba(244, 249, 247, 0.99));
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
    font-size: 11px;
    line-height: 1;
    letter-spacing: 0.34em;
    text-transform: uppercase;
    color: #c8ddd6;
    font-weight: 800;
  }

  .center-zone {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 0.65rem;
    min-height: 0;
  }

  .arabic-text {
    font-family: 'Amiri', serif;
    font-size: clamp(52px, 10vw, 96px);
    line-height: 1.08;
    color: #153f34;
    direction: rtl;
    display: flex;
    align-items: center;
    justify-content: center;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  .english-text {
    font-size: clamp(24px, 6vw, 34px);
    line-height: 1.15;
    font-weight: 600;
    color: #66a896;
    font-family: 'Manrope', sans-serif;
    font-style: italic;
  }

  .transliteration {
    font-size: 14px;
    color: #b7cfc7;
    font-style: italic;
    line-height: 1.2;
  }

  .flip-hint {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 10px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #d2ddd8;
    font-weight: 800;
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

    .arabic-text {
      font-size: 56px;
    }

    .english-text {
      font-size: 24px;
    }
  }
</style>
