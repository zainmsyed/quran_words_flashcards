<script lang="ts">
  import type { Word } from '../core/wordlist';
  import type { CardState } from '../core/srs';

  export let words: Word[] = [];
  export let states: Record<string, CardState> = {};

  const MASTERED_INTERVAL = 3;

  $: entries = words.map((word) => {
    const state = states[word.id];
    const mastered = Boolean(state && state.interval >= MASTERED_INTERVAL);
    const learning = Boolean(state && state.interval > 0 && state.interval < MASTERED_INTERVAL);
    const seen = Boolean(state && state.reviewCount > 0);
    const status = mastered ? 'mastered' : learning ? 'learning' : seen ? 'learning' : 'new';
    return { word, status };
  });

  $: mastered = entries.filter((entry) => entry.status === 'mastered');
  $: learning = entries.filter((entry) => entry.status === 'learning');
  $: newWords = entries.filter((entry) => entry.status === 'new');

  function statusLabel(status: string): string {
    if (status === 'mastered') return 'Mastered';
    if (status === 'learning') return 'Learning';
    return 'New';
  }
</script>

<section class="settings-card wordlist-panel">
  <div class="panel-heading">
    <div class="eyebrow">Deck</div>
    <h2>Word list</h2>
    <p>Browse the seeded deck grouped by your current study progress.</p>
  </div>

  <div class="group">
    <div class="group-header">
      <div>
        <h3>Mastered</h3>
        <p>Words you have reviewed enough times to be considered stable.</p>
      </div>
      <span class="group-count badge badge-mastered">{mastered.length}</span>
    </div>

    {#if mastered.length === 0}
      <p class="empty">None yet — keep going.</p>
    {:else}
      <div class="rows">
        {#each mastered as entry}
          <div class="row">
            <div class="row-copy">
              <div class="ar">{entry.word.arabic}</div>
              <div class="en">{entry.word.english}</div>
            </div>
            <span class="badge badge-mastered">{statusLabel(entry.status)}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="group">
    <div class="group-header">
      <div>
        <h3>Learning</h3>
        <p>Words that have been seen and are still in active rotation.</p>
      </div>
      <span class="group-count badge badge-learning">{learning.length}</span>
    </div>

    {#if learning.length === 0}
      <p class="empty">None in progress yet.</p>
    {:else}
      <div class="rows">
        {#each learning as entry}
          <div class="row">
            <div class="row-copy">
              <div class="ar">{entry.word.arabic}</div>
              <div class="en">{entry.word.english}</div>
            </div>
            <span class="badge badge-learning">{statusLabel(entry.status)}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="group">
    <div class="group-header">
      <div>
        <h3>New</h3>
        <p>Words that have not been introduced in a study session yet.</p>
      </div>
      <span class="group-count badge badge-new">{newWords.length}</span>
    </div>

    {#if newWords.length === 0}
      <p class="empty">All words have been introduced.</p>
    {:else}
      <div class="rows">
        {#each newWords as entry}
          <div class="row">
            <div class="row-copy">
              <div class="ar">{entry.word.arabic}</div>
              <div class="en">{entry.word.english}</div>
            </div>
            <span class="badge badge-new">{statusLabel(entry.status)}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .settings-card {
    background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(249,252,250,0.98));
    border-radius: 24px;
    border: 0.5px solid rgba(173, 179, 181, 0.15);
    box-shadow: 0 16px 32px rgba(0, 109, 75, 0.07);
    padding: 1.4rem;
  }

  .panel-heading {
    margin-bottom: 1.15rem;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--primary);
    margin-bottom: 0.35rem;
  }

  .panel-heading h2 {
    margin: 0 0 0.35rem 0;
    font-family: 'Manrope', sans-serif;
    font-size: clamp(1.45rem, 3vw, 2rem);
    line-height: 1;
    letter-spacing: -0.04em;
    color: var(--text);
  }

  .panel-heading p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .group + .group {
    margin-top: 1.1rem;
  }

  .group-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.8rem;
  }

  .group-header h3 {
    margin: 0;
    font-family: 'Manrope', sans-serif;
    font-size: 1.05rem;
    color: var(--text);
  }

  .group-header p {
    margin: 0.2rem 0 0 0;
    color: var(--text-secondary);
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .group-count {
    flex: 0 0 auto;
    min-width: 2rem;
    justify-content: center;
  }

  .rows {
    display: grid;
    gap: 0.75rem;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.9rem;
    padding: 1rem 1.05rem;
    border-radius: 22px;
    border: 0.5px solid rgba(173, 179, 181, 0.14);
    background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,251,249,0.98));
    box-shadow: 0 10px 18px rgba(0, 109, 75, 0.04);
  }

  .row-copy {
    min-width: 0;
  }

  .ar {
    font-family: 'Amiri', serif;
    direction: rtl;
    font-size: 1.55rem;
    line-height: 1.1;
    color: var(--primary);
  }

  .en {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-top: 0.18rem;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.38rem 0.75rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .badge-mastered {
    background: var(--success-bg);
    color: var(--success-text);
  }

  .badge-learning {
    background: var(--warn-bg);
    color: var(--warn-text);
  }

  .badge-new {
    background: var(--info-bg);
    color: var(--info-text);
  }

  .empty {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
    padding: 0.3rem 0;
  }

  @media (max-width: 720px) {
    .group-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .row {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
