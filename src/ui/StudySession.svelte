<script lang="ts">
  import { onMount } from 'svelte';
  import Card from './components/Card.svelte';
  import Stats from './Stats.svelte';
  import WordList from './WordList.svelte';
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

    // If there is a resumable session, load it
    if (savedSession && Array.isArray(savedSession.queue) && savedSession.index != null && savedSession.index < savedSession.queue.length) {
      sessionItems = savedSession.queue
        .filter((si) => wordMap.has(si.id))
        .map((si) => ({ id: si.id, mode: si.mode }));
      currentIndex = savedSession.index || 0;

      const itemStates = sessionItems.map((si) => states[si.id]).filter(Boolean);
      sessionNewCount = itemStates.filter((s) => s.interval === 0).length;
      sessionReviewCount = sessionItems.length - sessionNewCount;
    } else {
      // ensure state entries exist for every word in the app deck
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
      sessionItems = combined.map((w) => ({ id: w.id, mode: Math.random() < 0.5 ? 'ar2en' : 'en2ar' }));
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
    await buildSession(savedSession || undefined);

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

    // If the user marked HARD, re-queue this card near the end of the session
    if (rating === 'hard') {
      const newItem: SessionItem = { id: word.id, mode: Math.random() < 0.5 ? 'ar2en' : 'en2ar' };
      sessionItems.push(newItem);
      deck.push(word);
    }

    // advance
    currentIndex += 1;

    // persist session metadata
    await persistSession();
  }

  async function startNewSession() {
    await browserStorage.removeItem(SESSION_KEY);
    await buildSession(undefined);
  }
</script>

{#if loading}
  <p>Loading session…</p>
{:else}
  <div class="session-stack">
    {#if currentIndex >= deck.length}
      <div class="card session-card">
        <h3>Session complete</h3>
        <p>You studied {sessionNewCount} new words and reviewed {sessionReviewCount} due words.</p>
        <button on:click={startNewSession}>Start a new session</button>
      </div>
    {:else}
      <div class="card session-card">
        <div class="session-topline">
          <div class="session-controls">
            <button on:click={async () => { 
              if (currentIndex >= deck.length && deck.length > 0) {
                // if session was complete, step back to last card
                currentIndex = deck.length - 1;
              } else if (currentIndex > 0) {
                currentIndex -= 1;
              }
              await persistSession();
            }} disabled={deck.length === 0 || currentIndex === 0} aria-label="Previous card">Back</button>
          </div>

          <div class="session-progress">Card {currentIndex + 1} of {deck.length}</div>
          <div class="session-counts">{sessionNewCount} new · {sessionReviewCount} review</div>
        </div>

        <Card word={deck[currentIndex]} mode={sessionItems[currentIndex]?.mode || 'ar2en'} on:rate={(e) => handleRate(e.detail)} />
      </div>
    {/if}

    <Stats words={words} states={states} appStats={appStats} />
    <WordList words={words} states={states} />
  </div>
{/if}

<style>
  .session-stack{display:grid;gap:16px}
  .session-card{margin-top:12px}
  .session-topline{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:12px}
  .session-controls{margin-right:8px}
  .session-progress,.session-counts{font-size:0.9rem;color:#666}
  .session-controls button{padding:6px 10px;border-radius:6px;border:1px solid #ddd;background:#fff;cursor:pointer;margin-right:6px}
  button{padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#fff;cursor:pointer}
</style>
