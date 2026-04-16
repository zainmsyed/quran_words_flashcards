<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import Card from './components/Card.svelte';
  import AppTopbar from './components/AppTopbar.svelte';
  import { loadSeedWords, type Word } from '../core/wordlist';
  import { applyRatingToCard, initialCardState, normalizeCardState, type CardState } from '../core/srs';
  import { initialAppStats, recordStudy, type AppStats } from '../core/app-stats';
  import {
    buildSessionPlan,
    isSameLocalDay,
    normalizeSavedSession,
    retrySessionItem,
    type SavedSession,
    type SessionItem,
  } from '../core/session';
  import { summarizeStudyProgress } from '../core/progress-summary';
  import type { AuthSession } from '../core/pocketbase-auth';
  import {
    clearLegacyStudyStorage,
    loadAuthenticatedStudySnapshot,
    savePocketBaseCardState,
    savePocketBaseStudyState,
  } from '../core/pocketbase-study';

  export let authSession: AuthSession | null = null;

  const NEW_PER_SESSION = 10;
  const REVIEW_PER_SESSION = 5;

  const dispatch = createEventDispatcher<{ openSettings: undefined }>();

  let words: Word[] = [];
  let deck: Word[] = [];
  let sessionItems: SessionItem[] = [];
  let currentIndex = 0;
  let states: Record<string, CardState> = {};
  let appStats: AppStats = initialAppStats();
  let loading = true;
  let loadError = '';
  let sessionNewCount = 0;
  let sessionReviewCount = 0;
  let currentCardNumber = 0;
  let progressPercent = 0;
  let ratingBusy = false;

  $: currentCardNumber = deck.length > 0 ? Math.min(currentIndex + 1, deck.length) : 0;
  $: progressPercent = deck.length > 0 ? Math.round((currentCardNumber / deck.length) * 100) : 0;



  function normalizeStates(input: Record<string, CardState> | null | undefined) {
    const out: Record<string, CardState> = {};
    for (const [id, state] of Object.entries(input || {})) {
      out[id] = normalizeCardState({ id, ...state });
    }
    return out;
  }

  function makeWordMap(list: Word[]) {
    return new Map(list.map((word) => [word.id, word] as const));
  }

  function ensureCardStates() {
    words.forEach((word) => {
      if (!states[word.id]) states[word.id] = initialCardState(word.id);
    });
  }

  async function buildSession(savedSession?: SavedSession) {
    const wordMap = makeWordMap(words);
    const plan = buildSessionPlan(words, states, savedSession, {
      limits: { newPerSession: NEW_PER_SESSION, reviewPerSession: REVIEW_PER_SESSION },
    });

    sessionItems = plan.queue;
    currentIndex = plan.currentIndex;
    sessionNewCount = plan.newCount;
    sessionReviewCount = plan.reviewCount;
    deck = sessionItems.map((si) => wordMap.get(si.id)).filter(Boolean) as Word[];
  }

  function currentSessionSnapshot(createdAt = new Date().toISOString()): SavedSession {
    return {
      queue: sessionItems.map((item) => ({ ...item })),
      index: currentIndex,
      createdAt,
    };
  }

  async function persistStudySnapshot(nextStats: AppStats, nextSession: SavedSession | null) {
    if (!authSession) {
      throw new Error('Missing PocketBase session.');
    }

    await savePocketBaseStudyState(authSession, nextStats, nextSession);
  }

  async function persistStudySnapshotWithRetry(nextStats: AppStats, nextSession: SavedSession | null): Promise<boolean> {
    try {
      await persistStudySnapshot(nextStats, nextSession);
      return true;
    } catch (firstError) {
      try {
        await persistStudySnapshot(nextStats, nextSession);
        return true;
      } catch (retryError) {
        console.warn(firstError);
        console.warn(retryError);
        return false;
      }
    }
  }

  async function initializeSession() {
    if (!authSession) {
      throw new Error('Missing PocketBase session.');
    }

    words = await loadSeedWords();
    const snapshot = await loadAuthenticatedStudySnapshot(authSession, words);
    states = normalizeStates(snapshot.states);
    ensureCardStates();

    const summary = summarizeStudyProgress(words, states, new Date());
    const syncedStats = {
      ...snapshot.appStats,
      studied: summary.seenWords,
      easy: summary.easyCount,
    };

    const savedSession = normalizeSavedSession(snapshot.session);
    const effectiveSession = savedSession && isSameLocalDay(savedSession.createdAt) ? savedSession : null;
    const statsChanged = syncedStats.studied !== snapshot.appStats.studied || syncedStats.easy !== snapshot.appStats.easy;

    appStats = syncedStats;
    await buildSession(effectiveSession || undefined);

    if (!effectiveSession || statsChanged) {
      const sessionToPersist = effectiveSession ?? currentSessionSnapshot();
      const persisted = await persistStudySnapshotWithRetry(syncedStats, sessionToPersist);
      if (!persisted) {
        loadError = 'Could not save your PocketBase session.';
      }
    }

    await clearLegacyStudyStorage();
  }

  async function retryLoad() {
    loading = true;
    loadError = '';
    try {
      await initializeSession();
    } catch (error) {
      console.warn(error);
      loadError = 'Could not load your PocketBase study data.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void retryLoad();
  });

  function getStateFor(id: string) {
    if (!states[id]) states[id] = initialCardState(id);
    return states[id];
  }

  async function handleRate(rating: 'hard' | 'got' | 'easy') {
    if (ratingBusy) return;

    const word = deck[currentIndex];
    if (!word) return;

    const currentItem = sessionItems[currentIndex];
    const prev = getStateFor(word.id);
    const updated = applyRatingToCard(prev, rating);
    const nextStats = recordStudy(appStats, rating, new Date(), prev.interval === 0);
    const nextSessionItems = [...sessionItems];

    if (rating === 'hard' && currentItem) {
      nextSessionItems.push(retrySessionItem(currentItem));
    }

    const nextSession = {
      queue: nextSessionItems,
      index: currentIndex + 1,
      createdAt: new Date().toISOString(),
    } satisfies SavedSession;

    ratingBusy = true;
    try {
      await savePocketBaseCardState(authSession!, updated);
      const persisted = await persistStudySnapshotWithRetry(nextStats, nextSession);
      if (!persisted) {
        await retryLoad();
        return;
      }

      states[word.id] = updated;
      appStats = nextStats;
      loadError = '';

      if (rating === 'hard' && currentItem) {
        sessionItems.push(retrySessionItem(currentItem));
        deck.push(word);
      }

      currentIndex += 1;
    } catch (error) {
      console.warn(error);
      loadError = 'Could not save your PocketBase progress.';
    } finally {
      ratingBusy = false;
    }
  }

  async function reviewCompletedSession() {
    if (sessionItems.length === 0 || !authSession) return;

    const nextSession = {
      queue: sessionItems,
      index: 0,
      createdAt: new Date().toISOString(),
    } satisfies SavedSession;

    try {
      const persisted = await persistStudySnapshotWithRetry(appStats, nextSession);
      if (!persisted) {
        await retryLoad();
        return;
      }
      currentIndex = 0;
      loadError = '';
    } catch (error) {
      console.warn(error);
      loadError = 'Could not save your PocketBase session.';
    }
  }

  async function startFreshSession() {
    loading = true;
    loadError = '';
    try {
      ensureCardStates();
      await buildSession(undefined);
      const persisted = await persistStudySnapshotWithRetry(appStats, currentSessionSnapshot());
      if (!persisted) {
        await retryLoad();
        return;
      }
    } catch (error) {
      console.warn(error);
      loadError = 'Could not start a new PocketBase session.';
    } finally {
      loading = false;
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (loading || ratingBusy || currentIndex >= deck.length || event.repeat) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const target = event.target as HTMLElement | null;
    const tagName = target?.tagName?.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;

    if (event.key === '1') {
      event.preventDefault();
      void handleRate('hard');
    } else if (event.key === '2') {
      event.preventDefault();
      void handleRate('got');
    } else if (event.key === '3') {
      event.preventDefault();
      void handleRate('easy');
    }
  }

  function openSettings() {
    dispatch('openSettings');
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

{#if loading}
  <div class="loading-screen">
    <p>Loading session…</p>
  </div>
{:else if loadError && deck.length === 0 && sessionItems.length === 0}
  <div class="loading-screen">
    <div class="load-error-card" role="alert">
      <p class="load-error-title">Could not load your PocketBase study data</p>
      <p class="load-error-copy">{loadError}</p>
      <button type="button" class="retry-load-btn" on:click={retryLoad}>Retry</button>
    </div>
  </div>
{:else}
  <div class="device-shell">
    <AppTopbar buttonIcon="menu" buttonLabel="Open settings" onAction={openSettings} />

    <div class="session-main">
      <div class="card-stage">
        {#if loadError && deck.length > 0}
          <div class="session-alert" role="alert">{loadError}</div>
        {/if}
        {#if deck.length > 0}
          <div class="progress-scene">
            <div class="progress-card" aria-label={`Session progress ${currentCardNumber} of ${deck.length}`}>
              <div class="progress-label">
                <span>Session progress</span>
                <strong>{currentCardNumber} / {deck.length}</strong>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style={`width: ${progressPercent}%`}></div>
              </div>
              <div class="session-quota" aria-live="polite">
                <div class="quota-badges" role="status" aria-live="polite">
                  <span class="badge badge-new" aria-label={sessionNewCount + ' new'}>
                    <span class="badge-count">{sessionNewCount}</span>
                    <span class="badge-label">new</span>
                  </span>
                  <span class="badge badge-review" aria-label={sessionReviewCount + ' to review'}>
                    <span class="badge-count">{sessionReviewCount}</span>
                    <span class="badge-label">review</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        {/if}

        {#if currentIndex >= deck.length}
          <div class="session-complete">
            <div class="complete-mark">✓</div>
            <h2>{deck.length === 0 ? 'All caught up' : 'Session complete'}</h2>
            <p>
              {#if deck.length === 0}
                No new or due cards are available right now. You can check again or come back later.
              {:else}
                You studied {sessionNewCount} new words and reviewed {sessionReviewCount} due words.
              {/if}
            </p>
            <div class="session-actions">
              <button type="button" class="review-again" on:click={startFreshSession}>
                {deck.length === 0 ? 'Check again' : 'Start new session'}
              </button>
              {#if sessionItems.length > 0}
                <button type="button" class="review-again secondary" on:click={reviewCompletedSession}>Review again</button>
              {/if}
            </div>
          </div>
        {:else}
          <Card word={deck[currentIndex]} mode={sessionItems[currentIndex]?.mode || 'ar2en'} />
        {/if}
      </div>

      {#if currentIndex < deck.length}
        <div class="rating-row" aria-label="Rate this card">
          <button type="button" class="rating-btn hard" on:click={() => handleRate('hard')} aria-label="Hard" disabled={ratingBusy}>
            <span class="rating-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13 3c-1.6 2.6-1.5 4.7-.4 6.4 1 1.6 2.7 2.9 3.7 4.2 1.1 1.4 1.5 3 .9 5.2-.2.8-.8 1.7-1.7 2.2-1.2.7-2.6.8-3.9.4-1.5-.4-2.8-1.3-3.8-2.6-.9-1.2-1.4-2.7-1.4-4.3 0-2.2.9-4.1 2.2-5.7C9.9 6.4 11.4 4.7 13 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="rating-label">Hard</span>
          </button>

          <button type="button" class="rating-btn got" on:click={() => handleRate('got')} aria-label="Got it" disabled={ratingBusy}>
            <span class="rating-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.1 4.2L19 6.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="rating-label">Got it</span>
          </button>

          <button type="button" class="rating-btn easy" on:click={() => handleRate('easy')} aria-label="Easy" disabled={ratingBusy}>
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

  .load-error-card {
    width: min(100%, 30rem);
    padding: 1.5rem 1.25rem;
    border-radius: 24px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(249, 252, 250, 0.97));
    border: 0.5px solid rgba(173, 179, 181, 0.15);
    box-shadow: 0 24px 48px rgba(0, 109, 75, 0.08);
    text-align: center;
  }

  .load-error-title {
    margin: 0;
    color: var(--text);
    font-size: 1.05rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .load-error-copy {
    margin: 0.75rem 0 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
    letter-spacing: 0;
    text-transform: none;
  }

  .retry-load-btn {
    min-height: 50px;
    margin-top: 1.1rem;
    padding: 0.8rem 1.15rem;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dim));
    color: var(--on-primary);
    font-size: 0.88rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 16px 26px rgba(0, 109, 75, 0.16);
  }

  .session-alert {
    width: 100%;
    padding: 0.9rem 1rem;
    border-radius: 18px;
    background: rgba(255, 240, 240, 0.96);
    color: #ad4f4f;
    border: 0.5px solid rgba(208, 121, 121, 0.18);
    font-size: 0.92rem;
    line-height: 1.5;
    font-weight: 700;
  }

  .device-shell {
    --session-gutter: clamp(1.25rem, 3.5vw, 2.5rem);
    width: 100%;
    min-height: 100%;
    padding: 0;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    border-radius: 0;
    background: transparent;
    border: 0;
    box-shadow: none;
    overflow: visible;
  }

  .session-main {
    flex: 1;
    width: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: var(--session-gutter) minmax(0, 1fr) var(--session-gutter);
    align-content: start;
  }

  .progress-scene {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-inline: auto;
  }

  .progress-card {
    width: 100%;
    padding: 1rem;
    border-radius: 6px;
    border: 0.5px solid var(--border);
    background: var(--card);
    box-shadow: var(--shadow-primary);
  }

  .progress-label {
    margin-bottom: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.72rem;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    font-weight: 800;
  }

  .progress-label strong {
    font-family: 'Space Grotesk', sans-serif;
    color: var(--primary);
    font-size: 0.95rem;
    letter-spacing: 0.06em;
  }

  .progress-bar {
    height: 8px;
    background: rgba(17, 17, 17, 0.08);
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.04);
  }

  .progress-fill {
    background: linear-gradient(90deg, var(--primary), var(--primary-dim));
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
  }

  .progress-meta {
    margin-top: 0.55rem;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .session-quota {
    margin-top: 0.4rem;
  }

  .quota-badges {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-family: 'Work Sans', sans-serif;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .badge-count {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 900;
    font-size: 0.95rem;
  }

  .badge-label {
    font-weight: 700;
    opacity: 0.95;
    font-size: 0.72rem;
    text-transform: none;
  }

  .badge-new {
    background: var(--primary);
    color: var(--on-primary);
  }

  .badge-review {
    background: var(--primary-container);
    color: var(--primary);
    border: 0.5px solid var(--border);
  }

  .card-stage {
    grid-column: 2;
    width: 100%;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 1rem;
    margin-top: 1.2rem;
  }

  .rating-row {
    grid-column: 2;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    width: 100%;
    min-width: 0;
    margin: 1.2rem auto 0;
    padding: 0 0.1rem;
  }

  .rating-btn {
    appearance: none;
    border: 0.5px solid var(--border);
    background: var(--card);
    box-shadow: var(--shadow-primary);
    padding: 0.95rem 0.85rem;
    min-height: 5.25rem;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 0.45rem;
    border-radius: 6px;
    color: var(--text);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.72rem;
    font-family: 'Work Sans', sans-serif;
    font-weight: 800;
    transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s, opacity 0.15s;
  }

  .rating-btn:hover {
    background: var(--primary-container);
    border-color: rgba(214, 40, 40, 0.18);
    opacity: 1;
    transform: translateY(-1px);
  }

  .rating-btn:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 3px;
  }

  .rating-btn[disabled] {
    opacity: 0.55;
    pointer-events: none;
    transform: none;
  }

  .rating-icon {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 6px;
    display: grid;
    place-items: center;
    background: var(--primary-container);
    color: var(--primary);
    box-shadow: none;
    border: 0.5px solid rgba(214, 40, 40, 0.12);
  }

  .rating-icon svg {
    width: 20px;
    height: 20px;
  }

  .rating-btn.hard {
    color: var(--danger-bg);
  }

  .rating-btn.hard .rating-icon {
    background: var(--danger-bg);
    color: var(--on-primary);
    border-color: var(--danger-bg);
  }

  .rating-btn.got {
    color: var(--text);
  }

  .rating-btn.got .rating-icon {
    background: var(--info-bg);
    color: var(--info-text);
    border-color: rgba(214, 40, 40, 0.08);
  }

  .rating-btn.easy {
    color: var(--success-bg);
  }

  .rating-btn.easy .rating-icon {
    background: var(--success-bg);
    color: var(--on-primary);
    border-color: var(--success-bg);
  }

  .rating-label {
    line-height: 1;
    font-size: 0.72rem;
    font-weight: 800;
  }

  .session-complete {
    width: 100%;
    max-width: 28rem;
    margin: 0 auto;
    padding: 1.5rem 1.2rem;
    text-align: center;
    border-radius: 6px;
    border: 0.5px solid var(--border);
    background: var(--card);
    box-shadow: var(--shadow-primary);
  }

  .complete-mark {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 0.9rem;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: var(--primary-container);
    color: var(--primary);
    font-size: 1.2rem;
    font-weight: 800;
  }

  .session-complete h2 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.35rem;
    line-height: 1;
    color: var(--text);
    margin-bottom: 0.55rem;
  }

  .session-complete p {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.65;
    margin-bottom: 1.1rem;
    font-family: 'Work Sans', sans-serif;
  }

  .session-actions {
    display: grid;
    gap: 0.7rem;
  }

  .review-again {
    width: 100%;
    border: 0;
    border-radius: 6px;
    padding: 0.9rem 1rem;
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    background: var(--primary);
    color: var(--on-primary);
    box-shadow: var(--shadow-primary);
  }

  .review-again:hover {
    background: var(--primary-dim);
    opacity: 1;
    transform: translateY(-1px);
  }

  .review-again.secondary {
    background: var(--card);
    color: var(--primary);
    border: 0.5px solid var(--border);
    box-shadow: var(--shadow-primary);
  }

  .review-again.secondary:hover {
    background: var(--primary-container);
    border-color: rgba(214, 40, 40, 0.18);
    opacity: 1;
    transform: translateY(-1px);
  }

  @media (max-width: 720px) {
    .rating-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.5rem;
    }
  }

  @media (max-width: 520px) {
    .device-shell {
      --session-gutter: 0.95rem;
      height: 100dvh;
      min-height: 100dvh;
      padding: 0;
      border-radius: 0;
    }

    .progress-card {
      padding: 1rem 0.95rem 0.95rem;
    }

    .progress-bar {
      height: 8px;
    }

    .rating-btn {
      min-height: 4.35rem;
      padding: 0.68rem 0.55rem;
      letter-spacing: 0.1em;
      font-size: 0.68rem;
    }

    .rating-icon {
      width: 2.45rem;
      height: 2.45rem;
    }

    .rating-icon svg {
      width: 18px;
      height: 18px;
    }
  }
</style>
