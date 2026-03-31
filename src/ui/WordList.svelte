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
    return { word, state, status };
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

<section class="panel wordlist-panel">
  <div class="panel-heading">
    <h2>Word list</h2>
    <p>Grouped by progress state.</p>
  </div>

  <div class="group">
    <div class="group-title">Mastered <span>{mastered.length}</span></div>
    {#if mastered.length === 0}
      <p class="empty">None yet — keep going.</p>
    {:else}
      <div class="rows">
        {#each mastered as entry}
          <div class="row">
            <div class="left">
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
    <div class="group-title">Learning <span>{learning.length}</span></div>
    {#if learning.length === 0}
      <p class="empty">None in progress yet.</p>
    {:else}
      <div class="rows">
        {#each learning as entry}
          <div class="row">
            <div class="left">
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
    <div class="group-title">New <span>{newWords.length}</span></div>
    {#if newWords.length === 0}
      <p class="empty">All words have been introduced.</p>
    {:else}
      <div class="rows">
        {#each newWords as entry}
          <div class="row">
            <div class="left">
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
  .panel{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;box-shadow:0 6px 18px rgba(2,6,23,0.05)}
  .panel-heading h2{margin:0 0 4px 0;font-size:1.1rem}
  .panel-heading p{margin:0 0 12px 0;color:#64748b;font-size:0.9rem}
  .group{margin-top:12px}
  .group-title{display:flex;align-items:center;justify-content:space-between;font-weight:700;margin-bottom:8px}
  .group-title span{color:#64748b;font-weight:600}
  .rows{display:flex;flex-direction:column;gap:8px}
  .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0}
  .left{min-width:0}
  .ar{font-family:'Amiri', serif;direction:rtl;font-size:1.15rem}
  .en{font-size:0.9rem;color:#475569}
  .badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:0.72rem;font-weight:700;background:#e2e8f0;color:#334155;white-space:nowrap}
  .badge-mastered{background:#dcfce7;color:#166534}
  .badge-learning{background:#fef3c7;color:#92400e}
  .badge-new{background:#dbeafe;color:#1d4ed8}
  .empty{color:#64748b;font-size:0.92rem;margin:0}
  @media (max-width: 640px){
    .row{flex-direction:column;align-items:flex-start;}
  }
</style>
