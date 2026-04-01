<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
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

  const dispatch = createEventDispatcher<{ openSettings: undefined }>();

  let words: Word[] = [];
  let deck: Word[] = [];
  let sessionItems: SessionItem[] = [];
  let currentIndex = 0;
  let states: Record<string, CardState> = {};
  let appStats: AppStats = initialAppStats();
  let loading = true;
  let sessionNewCount = 0;
  let sessionReviewCount = 0;
  let currentCardNumber = 0;
  let progressPercent = 0;

  $: currentCardNumber = deck.length > 0 ? Math.min(currentIndex + 1, deck.length) : 0;
  $: progressPercent = deck.length > 0 ? Math.round((currentCardNumber / deck.length) * 100) : 0;

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

  async function retrySession() {
    if (deck.length === 0) return;
    currentIndex = 0;
    await persistSession();
  }

  function openSettings() {
    dispatch('openSettings');
  }
</script>

{#if loading}
  <div class="loading-screen">
    <p>Loading session…</p>
  </div>
{:else}
  <div class="device-shell">
    <header class="session-header">
      <button class="nav-btn" type="button" on:click={openSettings} aria-label="Open settings">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15.5 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="session-title">SESSION: QURANIC WORDS</div>
    </header>

    <div class="session-main">
      <div class="progress-badge">PROGRESS {currentCardNumber} / {deck.length}</div>

      <div class="card-stage">
        {#if currentIndex >= deck.length}
          <div class="session-complete">
            <div class="complete-mark">✓</div>
            <h2>Session complete</h2>
            <p>You studied {sessionNewCount} new words and reviewed {sessionReviewCount} due words.</p>
            <button type="button" class="review-again" on:click={retrySession}>Review again</button>
          </div>
        {:else}
          <Card word={deck[currentIndex]} mode={sessionItems[currentIndex]?.mode || 'ar2en'} />
        {/if}
      </div>

      {#if currentIndex < deck.length}
        <div class="rating-row" aria-label="Rate this card">
          <button type="button" class="rating-btn hard" on:click={() => handleRate('hard')} aria-label="Hard">
            <span class="rating-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13 3c-1.6 2.6-1.5 4.7-.4 6.4 1 1.6 2.7 2.9 3.7 4.2 1.1 1.4 1.5 3 .9 5.2-.2.8-.8 1.7-1.7 2.2-1.2.7-2.6.8-3.9.4-1.5-.4-2.8-1.3-3.8-2.6-.9-1.2-1.4-2.7-1.4-4.3 0-2.2.9-4.1 2.2-5.7C9.9 6.4 11.4 4.7 13 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="rating-label">Hard</span>
          </button>

          <button type="button" class="rating-btn got" on:click={() => handleRate('got')} aria-label="Got it">
            <span class="rating-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.1 4.2L19 6.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="rating-label">Got it</span>
          </button>

          <button type="button" class="rating-btn easy" on:click={() => handleRate('easy')} aria-label="Easy">
            <span class="rating-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.3 2.8L5.8 13h4.8l-1 8.1 8.6-11.3H13l.3-7Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="rating-label">Easy</span>
          </button>
        </div>
      {/if}
    </div>

    <footer class="session-footer">QURANIC ARABIC | MINIMAL MODE</footer>
  </div>
{/if}

<style>
  .loading-screen {
    min-height: 100vh;
    display: grid;
    place-items: center;
    color: rgba(255, 255, 255, 0.82);
    font-size: 14px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }

  .device-shell {
    --session-gutter: clamp(1.25rem, 3.5vw, 2.5rem);
    width: 100%;
    min-height: calc(100vh - 1.5rem);
    padding: 1rem 0 1.1rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 253, 251, 0.96));
    border: 1px solid rgba(255, 255, 255, 0.72);
    box-shadow: 0 28px 60px rgba(0, 0, 0, 0.35);
    overflow: hidden;
  }

  .session-header {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    width: 100%;
    padding-inline: var(--session-gutter);
    color: var(--primary);
  }

  .nav-btn {
    width: 1.9rem;
    height: 1.9rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #9fdcc8;
    box-shadow: none;
    padding: 0;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .nav-btn:hover {
    opacity: 1;
    transform: none;
  }

  .nav-btn svg {
    width: 18px;
    height: 18px;
  }

  .session-title {
    flex: 1;
    min-width: 0;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.42em;
    text-transform: uppercase;
    color: #cfeee4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .session-main {
    flex: 1;
    width: 100%;
    display: grid;
    grid-template-columns: var(--session-gutter) minmax(0, 1fr) var(--session-gutter);
    align-content: start;
  }

  .progress-badge {
    grid-column: 2;
    justify-self: center;
    margin-top: clamp(3.25rem, 14vh, 5.7rem);
    padding: 0.42rem 0.95rem;
    border-radius: 999px;
    background: rgba(213, 247, 236, 0.94);
    color: #1d8f69;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    box-shadow: 0 8px 20px rgba(18, 120, 82, 0.08);
  }

  .card-stage {
    grid-column: 2;
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1.2rem;
  }

  .rating-row {
    grid-column: 2;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.55rem;
    width: 100%;
    min-width: 0;
    margin: 1.6rem auto 0;
    padding: 0 0.1rem;
  }

  .rating-btn {
    appearance: none;
    border: 0;
    background: transparent;
    box-shadow: none;
    padding: 0;
    min-height: 0;
    display: grid;
    justify-items: center;
    gap: 0.45rem;
    color: var(--primary);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 10px;
    font-weight: 800;
  }

  .rating-btn:hover {
    opacity: 1;
    transform: none;
  }

  .rating-icon {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: inset 0 0 0 1px rgba(194, 229, 216, 0.7), 0 10px 18px rgba(32, 94, 74, 0.07);
  }

  .rating-icon svg {
    width: 20px;
    height: 20px;
  }

  .rating-btn.hard {
    color: #ea8d8d;
  }

  .rating-btn.hard .rating-icon {
    color: #ea8d8d;
    background: rgba(255, 243, 243, 0.98);
    box-shadow: inset 0 0 0 1px rgba(245, 199, 199, 0.72), 0 10px 18px rgba(202, 110, 110, 0.05);
  }

  .rating-btn.got {
    color: #55a98a;
  }

  .rating-btn.got .rating-icon {
    color: #1f9b71;
    background: rgba(220, 248, 237, 0.98);
    box-shadow: inset 0 0 0 1px rgba(164, 229, 205, 0.85), 0 10px 18px rgba(32, 146, 104, 0.08);
  }

  .rating-btn.easy {
    color: #84c999;
  }

  .rating-btn.easy .rating-icon {
    color: #74c58d;
    background: rgba(235, 252, 240, 0.98);
    box-shadow: inset 0 0 0 1px rgba(190, 236, 207, 0.88), 0 10px 18px rgba(69, 154, 97, 0.08);
  }

  .rating-label {
    line-height: 1;
  }

  .session-footer {
    margin-top: auto;
    padding-top: 1.2rem;
    padding-inline: var(--session-gutter);
    text-align: center;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.42em;
    text-transform: uppercase;
    color: rgba(175, 219, 202, 0.88);
  }

  .session-complete {
    width: 100%;
    max-width: 232px;
    margin: 0 auto;
    padding: 2rem 1.2rem 1.6rem;
    text-align: center;
    border-radius: 22px;
    border: 1px solid rgba(194, 229, 216, 0.54);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 252, 249, 0.98));
    box-shadow: 0 12px 30px rgba(18, 120, 82, 0.08);
  }

  .complete-mark {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 0.9rem;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: rgba(213, 247, 236, 0.98);
    color: #17885f;
    font-size: 1.2rem;
    font-weight: 800;
  }

  .session-complete h2 {
    font-family: 'Manrope', sans-serif;
    font-size: 1.4rem;
    line-height: 1;
    color: #23453c;
    margin-bottom: 0.55rem;
  }

  .session-complete p {
    color: #6f8e85;
    font-size: 0.95rem;
    line-height: 1.65;
    margin-bottom: 1.1rem;
  }

  .review-again {
    width: 100%;
    border: 0;
    border-radius: 999px;
    padding: 0.9rem 1rem;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: linear-gradient(135deg, #d7f2e6, #c8ecdd);
    color: #12805b;
    box-shadow: 0 10px 18px rgba(18, 120, 82, 0.08);
  }

  @media (max-width: 520px) {
    .device-shell {
      --session-gutter: 0.95rem;
      min-height: calc(100vh - 1rem);
      padding: 0.95rem 0 1rem;
      border-radius: 20px;
    }

    .progress-badge {
      margin-top: clamp(3rem, 14vh, 5.2rem);
    }
  }
</style>
