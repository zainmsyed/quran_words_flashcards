<script lang="ts">
  import type { Word } from '../core/wordlist';
  import type { CardState } from '../core/srs';
  import type { AppStats } from '../core/app-stats';

  export let words: Word[] = [];
  export let states: Record<string, CardState> = {};
  export let appStats: AppStats = { studied: 0, easy: 0, streak: 0, lastStudyDate: undefined };

  const MASTERED_INTERVAL = 3;

  $: now = Date.now();
  $: entries = words.map((word) => {
    const state = states[word.id];
    const interval = state?.interval ?? 0;
    const mastered = interval >= MASTERED_INTERVAL;
    const due = Boolean(state && interval > 0 && new Date(state.dueDate).getTime() <= now);
    return { word, state, interval, mastered, due };
  });
  $: studiedEntries = entries.filter((entry) => (entry.state?.reviewCount ?? 0) > 0);
  $: studiedCount = appStats.studied ?? studiedEntries.length;
  $: masteredCount = entries.filter((entry) => entry.mastered).length;
  $: dueCount = entries.filter((entry) => entry.due).length;
  $: streak = appStats.streak ?? 0;

  let selectedFilter: 'none' | 'studied' | 'mastered' | 'due' = 'none';
  $: filteredEntries = selectedFilter === 'studied'
    ? studiedEntries
    : (selectedFilter === 'mastered'
      ? entries.filter((e) => e.mastered)
      : (selectedFilter === 'due' ? entries.filter((e) => e.due) : []));

  function toggleFilter(f: 'studied' | 'mastered' | 'due') {
    selectedFilter = selectedFilter === f ? 'none' : f;
  }

  function statLabel(entry: (typeof entries)[number]): string {
    if (!entry.state || entry.state.interval === 0) return 'New';
    if (entry.mastered) return 'Mastered';
    if (entry.due) return 'Due';
    return 'Learning';
  }
</script>

<section class="stats-scene">
  <div class="stats-card stats-panel">
    <div class="panel-heading">
      <div class="eyebrow">Progress</div>
      <h2>Study overview</h2>
      <p>Based on your saved card state.</p>
    </div>

    <div class="stats-grid">
      <button class="stat-card clickable" type="button" on:click={() => toggleFilter('studied')} aria-pressed={selectedFilter === 'studied'}>
        <div class="stat-num">{studiedCount}</div>
        <div class="stat-label">studied</div>
      </button>

      <button class="stat-card clickable" type="button" on:click={() => toggleFilter('mastered')} aria-pressed={selectedFilter === 'mastered'}>
        <div class="stat-num">{masteredCount}</div>
        <div class="stat-label">mastered</div>
      </button>

      <button class="stat-card clickable" type="button" on:click={() => toggleFilter('due')} aria-pressed={selectedFilter === 'due'}>
        <div class="stat-num">{dueCount}</div>
        <div class="stat-label">due today</div>
      </button>

      <div class="stat-card">
        <div class="stat-num">{streak}</div>
        <div class="stat-label">day streak</div>
      </div>
    </div>

    {#if selectedFilter !== 'none'}
      <div class="recent-list">
        <div class="section-title">
          {selectedFilter === 'studied' ? `Studied words (${filteredEntries.length})` : (selectedFilter === 'mastered' ? `Mastered words (${filteredEntries.length})` : `Due today (${filteredEntries.length})`)}
        </div>
        {#if filteredEntries.length === 0}
          <p class="empty">{selectedFilter === 'due' ? 'No due words today.' : `No ${selectedFilter} words yet.`}</p>
        {:else}
          {#each filteredEntries as entry}
            <div class="recent-row">
              <div class="recent-main">
                <div class="ar">{entry.word.arabic}</div>
                <div class="en">{entry.word.english}</div>
              </div>
              <div class="recent-meta">
                <span class="badge badge-{statLabel(entry).toLowerCase()}">{statLabel(entry)}</span>
                <small>{entry.state?.lastRating}</small>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .stats-scene {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-inline: auto;
  }

  .stats-card {
    width: 100%;
    background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(249,252,250,0.98));
    border-radius: 24px;
    border: 0.5px solid rgba(173, 179, 181, 0.15);
    box-shadow: 0 16px 32px rgba(0, 109, 75, 0.07);
    padding: 1.35rem 1.15rem;
  }

  .panel-heading {
    margin-bottom: 1.1rem;
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

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.85rem;
    margin-bottom: 1rem;
  }

  .stat-card {
    appearance: none;
    border: 0.5px solid rgba(173, 179, 181, 0.14);
    border-radius: 24px;
    background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(242,246,244,0.98));
    min-height: 128px;
    padding: 1.1rem 0.9rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    box-shadow: 0 12px 22px rgba(0, 109, 75, 0.05);
  }

  .stat-card.clickable {
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }

  .stat-card.clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 24px rgba(0, 109, 75, 0.08);
  }

  .stat-card[aria-pressed='true'] {
    border-color: rgba(0, 109, 75, 0.18);
    background: linear-gradient(180deg, rgba(213,247,236,0.98), rgba(238,250,245,0.98));
    box-shadow: 0 14px 28px rgba(0, 109, 75, 0.09);
  }

  .stat-num {
    font-family: 'Manrope', sans-serif;
    font-size: clamp(2.1rem, 4.6vw, 3rem);
    font-weight: 900;
    line-height: 1;
    color: var(--primary);
  }

  .stat-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 0.35rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .recent-list {
    margin-top: 1rem;
  }

  .section-title {
    font-family: 'Manrope', sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text);
    margin-bottom: 0.75rem;
  }

  .empty {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
    padding: 0.5rem 0;
  }

  .recent-row {
    display: flex;
    justify-content: space-between;
    gap: 0.9rem;
    padding: 1rem 1.05rem;
    border-radius: 22px;
    border: 0.5px solid rgba(173, 179, 181, 0.14);
    background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,251,249,0.98));
    margin-bottom: 0.75rem;
    box-shadow: 0 10px 18px rgba(0, 109, 75, 0.04);
  }

  .recent-main {
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

  .recent-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
    white-space: nowrap;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.38rem 0.75rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 900;
    background: var(--primary-container);
    color: var(--primary);
    letter-spacing: 0.02em;
  }

  .badge-mastered { background: var(--success-bg); color: var(--success-text); }
  .badge-learning { background: var(--warn-bg); color: var(--warn-text); }
  .badge-due { background: var(--danger-bg); color: var(--danger-text); }
  .badge-new { background: var(--info-bg); color: var(--info-text); }

  small {
    color: var(--text-secondary);
    font-size: 0.8rem;
  }

  @media (max-width: 720px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .recent-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .recent-meta {
      align-items: flex-start;
    }
  }
</style>
