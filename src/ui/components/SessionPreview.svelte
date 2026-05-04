<script lang="ts">
  import type { Word } from '../../core/wordlist';

  export let words: Word[] = [];
  export let busy = false;
  export let onStart: () => void = () => {};
</script>

<section class="session-preview" aria-label="Review session words">
  <div class="preview-header">
    <p class="preview-eyebrow">Review first</p>
    <h2>Today&apos;s words</h2>
    <p>Read through this session&apos;s words, then start the flashcard test when you&apos;re ready.</p>
  </div>

  <div class="preview-list" role="list">
    {#each words as word (word.id)}
      <article class="preview-row" role="listitem">
        <div class="preview-arabic" dir="rtl">{word.arabic}</div>
        <div class="preview-copy">
          {#if word.transliteration}
            <div class="preview-transliteration">{word.transliteration}</div>
          {/if}
          <div class="preview-english">{word.english}</div>
        </div>
      </article>
    {/each}
  </div>

  <button type="button" class="start-test-btn" on:click={onStart} disabled={busy}>
    {busy ? 'Starting…' : 'Start test'}
  </button>
</section>

<style>
  .session-preview {
    width: 100%;
    display: grid;
    gap: 1rem;
    padding: 1.15rem;
    border-radius: 6px;
    border: 0.5px solid var(--border);
    background: var(--card);
    box-shadow: var(--shadow-primary);
  }

  .preview-header {
    display: grid;
    gap: 0.35rem;
  }

  .preview-eyebrow {
    margin: 0;
    color: var(--primary);
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .preview-header h2 {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(1.7rem, 6vw, 2.8rem);
    line-height: 1;
    letter-spacing: -0.04em;
    color: var(--text);
  }

  .preview-header p:last-child {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.55;
  }

  .preview-list {
    display: grid;
    gap: 0.65rem;
  }

  .preview-row {
    display: grid;
    grid-template-columns: minmax(5rem, 0.38fr) minmax(0, 1fr);
    align-items: center;
    gap: 0.9rem;
    min-height: 4.6rem;
    padding: 0.75rem 0.85rem;
    border-radius: 6px;
    border: 0.5px solid var(--border);
    background: var(--surface-container-lowest);
  }

  .preview-arabic {
    font-family: 'Noto Naskh Arabic', serif;
    font-size: clamp(2rem, 8vw, 3.2rem);
    line-height: 1.05;
    color: var(--text);
    text-align: center;
  }

  .preview-copy {
    min-width: 0;
    display: grid;
    gap: 0.2rem;
  }

  .preview-transliteration {
    color: var(--text-secondary);
    font-size: 0.96rem;
    font-style: italic;
    line-height: 1.3;
  }

  .preview-english {
    color: var(--text);
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .start-test-btn {
    width: 100%;
    min-height: 56px;
    border: 0;
    border-radius: 6px;
    background: var(--primary);
    color: var(--on-primary);
    box-shadow: var(--shadow-primary);
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .start-test-btn:hover {
    background: var(--primary-dim);
    opacity: 1;
    transform: translateY(-1px);
  }

  @media (max-width: 520px) {
    .session-preview {
      padding: 1rem 0.95rem;
    }

    .preview-row {
      grid-template-columns: minmax(4.5rem, 0.35fr) minmax(0, 1fr);
      gap: 0.75rem;
      padding: 0.7rem 0.75rem;
    }
  }
</style>
