<script lang="ts">
  import { onMount } from 'svelte';
  import Card from './components/Card.svelte';
  import { loadSeedWords, Word } from '../core/wordlist';
  import { browserStorage } from '../core/storage-adapter';
  import { initialCardState, applyRatingToCard, normalizeCardState, CardState } from '../core/srs';
  import { initialAppStats, normalizeAppStats, recordStudy, AppStats } from '../core/app-stats';

  const STATES_KEY = 'qfc2_states';
  const STATS_KEY = 'qfc2_stats';
  const SESSION_KEY = 'qfc2_session';
  const NEW_PER_SESSION = 10;
  const REVIEW_PER_SESSION = 5;

  type SessionItem = { id: string; mode: 'ar2en' | 'en2ar' };

  let words: Word[] = [];
  let deck: Word[] = [];
  let sessionItems: SessionItem[] = [];
  let currentIndex = 0;
  let states: Record<string, CardState> = {};
  let appStats: AppStats = initialAppStats();
  let loading = true;
  let sessionNewCount = 0;
  let sessionReviewCount = 0;
  $: progressPercent = deck.length > 0 ? Math.round((Math.min(currentIndex, deck.length) / deck.length) * 100) : 0;

  function normalizeStates(input: Record<string, CardState> | null | undefined) {
    const out: Record<string, CardState> = {};
    for (const [id, state] of Object.entries(input || {})) {
      out[id] = normalizeCardState({ id, ...state });
    }
    return out;
  }

  function normalizeStats(input: AppStats | null | undefined) {
    return normalizeAppStats(input || undefined);
  }

  function makeWordMap(list: Word[]) {
    return new Map(list.map((word) => [word.id, word] as const));
  }

  function toLocalDateKey(date: Date = new Date()): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }

  function isSameLocalDay(isoDate?: string) {
    if (!isoDate) return false;
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return false;
    return toLocalDateKey(parsed) === toLocalDateKey();
  }

  async function persistSession(index = currentIndex, queue = sessionItems) {
    await browserStorage.setItem(SESSION_KEY, {
      queue,
      index,
      createdAt: new Date().toISOString(),
    });
  }

  async function persistStats() {
    await browserStorage.setItem(STATS_KEY, appStats);
  }

  async function buildSession(savedSession?: { queue: SessionItem[]; index?: number; createdAt?: string }) {
    const wordMap = makeWordMap(words);

    if (savedSession && Array.isArray(savedSession.queue) && savedSession.index != null) {
      sessionItems = savedSession.queue
        .filter((si) => wordMap.has(si.id))
        .map((si) => ({ id: si.id, mode: 'ar2en' }));
      currentIndex = Math.min(savedSession.index || 0, sessionItems.length);

      const itemStates = sessionItems.map((si) => states[si.id]).filter(Boolean);
      sessionNewCount = itemStates.filter((s) => s.interval === 0).length;
      sessionReviewCount = sessionItems.length - sessionNewCount;
    } else {
      words.forEach((w) => {
        if (!states[w.id]) states[w.id] = initialCardState(w.id);
      });

      const now = Date.now();
      const dueReviews = words
        .filter((w) => {
          const s = states[w.id];
          return s && s.interval > 0 && new Date(s.dueDate).getTime() <= now;
        })
        .sort((a, b) => new Date(states[a.id].dueDate).getTime() - new Date(states[b.id].dueDate).getTime())
        .slice(0, REVIEW_PER_SESSION);

      const newCards = words
        .filter((w) => states[w.id] && states[w.id].interval === 0)
        .slice(0, NEW_PER_SESSION);

      sessionReviewCount = dueReviews.length;
      sessionNewCount = newCards.length;

      const combined = [...dueReviews, ...newCards];
      sessionItems = combined.map((w) => ({ id: w.id, mode: 'ar2en' }));
      currentIndex = 0;
      await persistSession();
    }

    deck = sessionItems.map((si) => wordMap.get(si.id)).filter(Boolean) as Word[];
  }

  onMount(async () => {
    words = await loadSeedWords();

    const savedStates = await browserStorage.getItem<Record<string, CardState>>(STATES_KEY);
    states = normalizeStates(savedStates);

    const savedStats = await browserStorage.getItem<AppStats>(STATS_KEY);
    appStats = normalizeStats(savedStats);

    const savedSession = await browserStorage.getItem<{ queue: SessionItem[]; index: number; createdAt?: string }>(SESSION_KEY);

    if (savedSession && !isSameLocalDay(savedSession.createdAt)) {
      await browserStorage.removeItem(SESSION_KEY);
      await buildSession(undefined);
    } else {
      await buildSession(savedSession || undefined);
    }

    loading = false;
  });

  function getStateFor(id: string) {
    if (!states[id]) states[id] = initialCardState(id);
    return states[id];
  }

  async function saveStates() {
    await browserStorage.setItem(STATES_KEY, states);
  }

  async function handleRate(rating: 'hard' | 'got' | 'easy') {
    const word = deck[currentIndex];
    if (!word) return;
    const prev = getStateFor(word.id);
    const updated = applyRatingToCard(prev, rating);
    states[word.id] = updated;
    appStats = recordStudy(appStats, rating);
    await saveStates();
    await persistStats();

    if (rating === 'hard') {
      const newItem: SessionItem = { id: word.id, mode: 'ar2en' };
      sessionItems.push(newItem);
      deck.push(word);
    }

    currentIndex += 1;
    await persistSession();
  }

  async function startNewSession() {
    await browserStorage.removeItem(SESSION_KEY);
    await buildSession(undefined);
  }

  async function retrySession() {
    if (deck.length === 0) return;
    currentIndex = 0;
    await persistSession();
  }

  async function goBack() {
    if (currentIndex >= deck.length && deck.length > 0) {
      currentIndex = deck.length - 1;
    } else if (currentIndex > 0) {
      currentIndex -= 1;
    }
    await persistSession();
  }
</script>

{#if loading}
  <p>Loading session…</p>
{:else}
  <div class="session-stack">
    <div class="progress-wrap">
      <div class="progress-label">
        <span>Card {Math.min(currentIndex + 1, deck.length || 1)} of {deck.length}</span>
        <span>{sessionNewCount} new · {sessionReviewCount} review</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style={`width:${progressPercent}%`}></div>
      </div>
    </div>

    <div class="session-toolbar">
      <div class="session-chip new">{sessionNewCount} new</div>
      <div class="session-chip review">{sessionReviewCount} review</div>
      <button class="action-btn" on:click={goBack} disabled={deck.length === 0 || currentIndex === 0} aria-label="Previous card">Back</button>
      <button class="action-btn primary" on:click={startNewSession}>New session</button>
    </div>

    {#if currentIndex >= deck.length}
      <div class="session-card session-done">
        <div class="big">🕌</div>
        <h3>Session complete</h3>
        <p>You studied {sessionNewCount} new words and reviewed {sessionReviewCount} due words.</p>
        <button class="action-btn primary" on:click={retrySession}>Review again</button>
      </div>
    {:else}
      <div class="session-card">
        {#key currentIndex}
          <Card word={deck[currentIndex]} mode={sessionItems[currentIndex]?.mode || 'ar2en'} on:rate={(e) => handleRate(e.detail)} />
        {/key}
      </div>
    {/if}
  </div>
{/if}

<style>
  .session-stack{display:grid;gap:1rem}
  .session-card{margin-top:0}
  .session-done{
    text-align:center;
    padding:2.5rem 1.75rem;
    border-radius:var(--radius-xl);
    background:var(--card);
    border:0.5px solid var(--border);
    box-shadow:var(--shadow-primary);
  }
  .session-done .big{font-size:48px;margin-bottom:0.5rem}
  .session-done h3{font-size:20px;font-weight:800;margin-bottom:0.5rem;font-family:'Manrope', sans-serif}
  .session-done p{font-size:14px;color:var(--text-secondary);line-height:1.7;max-width:32ch;margin:0 auto}
</style>
