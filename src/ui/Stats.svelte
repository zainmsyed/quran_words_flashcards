<script lang="ts">
  import type { Word } from '../core/wordlist';
  import type { CardState } from '../core/srs';

  export let words: Word[] = [];
  export let states: Record<string, CardState> = {};

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
  $: studiedCount = studiedEntries.length;
  $: masteredCount = entries.filter((entry) => entry.mastered).length;
  $: dueCount = entries.filter((entry) => entry.due).length;
  $: newCount = entries.filter((entry) => !entry.state || entry.state.interval === 0).length;
  $: reviewCount = studiedEntries.reduce((sum, entry) => sum + (entry.state?.reviewCount ?? 0), 0);
  $: easyCount = studiedEntries.reduce((sum, entry) => sum + (entry.state?.easyCount ?? 0), 0);
  $: accuracy = reviewCount > 0 ? Math.round((easyCount / reviewCount) * 100) : 0;
  $: avgEase = studiedCount > 0
    ? (studiedEntries.reduce((sum, entry) => sum + (entry.state?.ease ?? 0), 0) / studiedCount).toFixed(2)
    : '0.00';
  $: recent = studiedEntries
    .filter((entry) => Boolean(entry.state?.lastReviewedAt))
    .slice()
    .sort((a, b) => new Date(b.state?.lastReviewedAt || 0).getTime() - new Date(a.state?.lastReviewedAt || 0).getTime())
    .slice(0, 8);

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
      <div class="stat-num">{dueCount}</div>
      <div class="stat-label">due now</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">{accuracy}%</div>
      <div class="stat-label">easy rate</div>
    </div>
  </div>

  <div class="secondary-grid">
    <div class="secondary-card">
      <div class="secondary-value">{newCount}</div>
      <div class="secondary-label">new words remaining</div>
    </div>
    <div class="secondary-card">
      <div class="secondary-value">{avgEase}</div>
      <div class="secondary-label">average ease</div>
    </div>
    <div class="secondary-card">
      <div class="secondary-value">{reviewCount}</div>
      <div class="secondary-label">total reviews</div>
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
  .panel{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;box-shadow:0 6px 18px rgba(2,6,23,0.05)}
  .panel-heading h2{margin:0 0 4px 0;font-size:1.1rem}
  .panel-heading p{margin:0 0 12px 0;color:#64748b;font-size:0.9rem}
  .stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
  .stat-card{padding:12px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;text-align:center}
  .stat-num{font-size:1.6rem;font-weight:700}
  .stat-label{font-size:0.82rem;color:#64748b;margin-top:2px}
  .secondary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
  .secondary-card{padding:10px 12px;border-radius:10px;background:#fbfdff;border:1px solid #e2e8f0}
  .secondary-value{font-size:1.15rem;font-weight:700}
  .secondary-label{font-size:0.82rem;color:#64748b;margin-top:2px}
  .recent-list{margin-top:14px}
  .section-title{font-weight:600;margin-bottom:8px}
  .recent-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #eef2f7}
  .recent-main{min-width:0}
  .ar{font-family:'Amiri', serif;direction:rtl;font-size:1.15rem}
  .en{font-size:0.9rem;color:#475569}
  .recent-meta{display:flex;flex-direction:column;align-items:flex-end;gap:4px;white-space:nowrap}
  .badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:0.72rem;font-weight:700;background:#e2e8f0;color:#334155}
  .badge-mastered{background:#dcfce7;color:#166534}
  .badge-learning{background:#fef3c7;color:#92400e}
  .badge-due{background:#fee2e2;color:#991b1b}
  .badge-new{background:#dbeafe;color:#1d4ed8}
  .empty{color:#64748b;font-size:0.92rem}
  small{color:#64748b}
  @media (max-width: 640px){
    .stats-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .secondary-grid{grid-template-columns:1fr;}
    .recent-row{flex-direction:column;}
    .recent-meta{align-items:flex-start;}
  }
</style>
