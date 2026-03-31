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

  $: recent = studiedEntries
    .filter((entry) => Boolean(entry.state?.lastReviewedAt))
    .slice()
    .sort((a, b) => new Date(b.state?.lastReviewedAt || 0).getTime() - new Date(a.state?.lastReviewedAt || 0).getTime())
    .slice(0, 6);

  function statLabel(entry: (typeof entries)[number]): string {
    if (!entry.state || entry.state.interval === 0) return 'New';
    if (entry.mastered) return 'Mastered';
    if (entry.due) return 'Due';
    return 'Learning';
  }
</script>

<section class="panel stats-panel">
  <div class="panel-heading">
    <h2>Progress</h2>
    <p>Based on your saved card state.</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-num">{studiedCount}</div>
      <div class="stat-label">studied</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">{masteredCount}</div>
      <div class="stat-label">mastered</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">{streak}</div>
      <div class="stat-label">day streak</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">{dueCount}</div>
      <div class="stat-label">due today</div>
    </div>
  </div>

  <div class="recent-list">
    <div class="section-title">Recent progress</div>
    {#if recent.length === 0}
      <p class="empty">No study history yet — start rating cards to see progress here.</p>
    {:else}
      {#each recent as entry}
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
</section>

<style>
  .panel{background:var(--card);border:0.5px solid var(--border);border-radius:var(--radius-lg);padding:16px;box-shadow:0 6px 18px rgba(2,6,23,0.05)}
  .panel-heading h2{margin:0 0 4px 0;font-size:1.1rem}
  .panel-heading p{margin:0 0 12px 0;color:var(--text-secondary);font-size:0.9rem}
  .stats-grid{display:grid;grid-template-columns:1fr;gap:12px;margin-bottom:14px}
  .stat-card{padding:16px;border-radius:10px;background:var(--bg-secondary);border:0.5px solid var(--border);text-align:center;min-height:110px;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .stat-num{font-size:28px;font-weight:800;color:var(--text)}
  .stat-label{font-size:0.95rem;color:var(--text-secondary);margin-top:6px}
  .secondary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}
  .secondary-card{padding:10px 12px;border-radius:10px;background:var(--bg-secondary);border:0.5px solid var(--border)}
  .secondary-value{font-size:1.15rem;font-weight:700;color:var(--text)}
  .secondary-label{font-size:0.82rem;color:var(--text-secondary);margin-top:2px}
  .recent-list{margin-top:14px}
  .section-title{font-weight:600;margin-bottom:8px}
  .recent-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:0.5px solid var(--border)}
  .recent-main{min-width:0}
  .ar{font-family:'Amiri', serif;direction:rtl;font-size:1.15rem}
  .en{font-size:0.9rem;color:var(--text-secondary)}
  .recent-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px;white-space:nowrap}
  .badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:0.72rem;font-weight:700;background:#e2e8f0;color:#334155}
  .badge-mastered{background:#dcfce7;color:#166534}
  .badge-learning{background:#fef3c7;color:#92400e}
  .badge-due{background:#fee2e2;color:#991b1b}
  .badge-new{background:#dbeafe;color:#1d4ed8}
  .empty{color:var(--text-secondary);font-size:0.92rem}
  small{color:var(--text-secondary)}
  @media (max-width: 640px){
    .stats-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .secondary-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .recent-row{flex-direction:column;}
    .recent-meta{align-items:flex-start;}
  }
</style>