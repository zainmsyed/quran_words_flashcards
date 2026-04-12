<script lang="ts">
  import type { Word } from '../core/wordlist';
  import type { CardState } from '../core/srs';
  import type { AppStats } from '../core/app-stats';
  import { summarizeStudyProgress } from '../core/progress-summary';

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
  $: seenEntries = entries.filter((entry) => (entry.state?.reviewCount ?? 0) > 0);
  $: summary = summarizeStudyProgress(words, states, new Date(now));
  $: seenCount = summary.seenWords;
  $: reviewCount = summary.reviewCount;
  $: easyRate = reviewCount > 0 ? Math.round((summary.easyCount / reviewCount) * 100) : 0;
  $: masteredCount = summary.masteredCount;
  $: dueCount = summary.dueCount;
  $: streak = appStats.streak ?? 0;

  let selectedFilter: 'none' | 'seen' | 'mastered' | 'due' = 'none';
  $: filteredEntries = selectedFilter === 'seen'
    ? seenEntries
    : (selectedFilter === 'mastered'
      ? entries.filter((e) => e.mastered)
      : (selectedFilter === 'due' ? entries.filter((e) => e.due) : []));

  function toggleFilter(f: 'seen' | 'mastered' | 'due') {
    selectedFilter = selectedFilter === f ? 'none' : f;
  }

  function statLabel(entry: (typeof entries)[number]): string {
    if (!entry.state || entry.state.interval === 0) return 'New';
    if (entry.mastered) return 'Mastered';
    if (entry.due) return 'Due';
    return 'Learning';
  }

  $: sectionTitleText = selectedFilter === 'seen' ? 'Seen words' : (selectedFilter === 'mastered' ? 'Mastered words' : 'Due today');
  $: sectionBadgeClass = selectedFilter === 'seen' ? 'badge-learning' : (selectedFilter === 'mastered' ? 'badge-mastered' : 'badge-due');
</script>

<section class="stats-scene">
  <div class="stats-card stats-panel">
    <div class="panel-heading">
      <div class="eyebrow">Progress</div>
      <h2>Study overview</h2>
      <p>Based on your saved card state.</p>
    </div>

    <div class="stats-grid">
      <button class="stat-card clickable" type="button" on:click={() => toggleFilter('seen')} aria-pressed={selectedFilter === 'seen'}>
        <div class="stat-num">{seenCount}</div>
        <div class="stat-label">seen words</div>
        <div class="stat-meta">unique cards with at least one review</div>
      </button>

      <div class="stat-card">
        <div class="stat-num">{reviewCount}</div>
        <div class="stat-label">reviews</div>
        <div class="stat-meta">{easyRate}% easy · {summary.easyCount} easy picks</div>
      </div>

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
          <h3>{sectionTitleText} <span class={"section-count badge " + sectionBadgeClass}>{filteredEntries.length}</span></h3>
        </div>
        {#if filteredEntries.length === 0}
          <p class="empty">{selectedFilter === 'due' ? 'No due words today.' : `No ${selectedFilter} words yet.`}</p>
        {:else}
          {#each filteredEntries as entry}
            <div class="word-row recent-row">
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
    background: var(--card);
    border-radius: 6px;
    border: 0.5px solid var(--border);
    box-shadow: var(--shadow-primary);
    padding: 1.25rem;
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
    font-family: 'Space Grotesk', sans-serif;
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

  .recent-list {
    margin-top: 1rem;
  }

  .section-title {
    margin-bottom: 0.75rem;
  }

  .section-title h3 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text);
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section-count {
    min-width: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }

  .recent-row {
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .word-row.recent-row .ar {
    text-align: left;
  }

  .recent-main {
    min-width: 0;
  }

  .recent-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
    white-space: nowrap;
  }

  .recent-meta small {
    color: var(--text-secondary);
    font-size: 0.8rem;
  }

  .empty {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
    padding: 0.5rem 0;
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
