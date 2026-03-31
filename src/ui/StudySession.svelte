<script lang="ts">
  import { onMount } from 'svelte';
  import Card from './components/Card.svelte';
  import { loadSeedWords, Word } from '../core/wordlist';
  import { browserStorage } from '../core/storage-adapter';
  import { initialCardState, applyRatingToCard, CardState } from '../core/srs';

  const STATES_KEY = 'qfc2_states';
  const SESSION_KEY = 'qfc2_session';
  const NEW_PER_SESSION = 10;
  const REVIEW_PER_SESSION = 5;

  type SessionItem = { id: string; mode: 'ar2en' | 'en2ar' };

  let words: Word[] = [];
  let deck: Word[] = [];
  let sessionItems: SessionItem[] = [];
  let currentIndex = 0;
  let states: Record<string, CardState> = {};
  let loading = true;
  let sessionNewCount = 0;
  let sessionReviewCount = 0;

  async function buildSession(savedSession?: { queue: SessionItem[]; index?: number; createdAt?: string }) {
    // If there is a resumable session, load it
    if (savedSession && Array.isArray(savedSession.queue) && savedSession.index != null && savedSession.index < savedSession.queue.length) {
      // filter out any ids that no longer exist
      sessionItems = savedSession.queue.filter((si) => words.find((w) => w.id === si.id)).map((si) => ({ id: si.id, mode: si.mode }));
      currentIndex = savedSession.index || 0;

      // compute counts
      sessionNewCount = sessionItems.filter((si) => states[si.id] && states[si.id].interval === 0).length;
      sessionReviewCount = sessionItems.length - sessionNewCount;
    } else {
      // ensure state entries exist
      words.forEach((w) => { if (!states[w.id]) states[w.id] = initialCardState(w.id); });

      const now = Date.now();

      const dueReviews = words.filter((w) => {
        const s = states[w.id];
        return s && s.interval > 0 && new Date(s.dueDate).getTime() <= now;
      }).sort((a, b) => new Date(states[a.id].dueDate).getTime() - new Date(states[b.id].dueDate).getTime()).slice(0, REVIEW_PER_SESSION);

      const newCards = words.filter((w) => states[w.id] && states[w.id].interval === 0).slice(0, NEW_PER_SESSION);

      sessionReviewCount = dueReviews.length;
      sessionNewCount = newCards.length;

      const combined = [...dueReviews, ...newCards];
      sessionItems = combined.map((w) => ({ id: w.id, mode: Math.random() < 0.5 ? 'ar2en' : 'en2ar' }));

      currentIndex = 0;
      await browserStorage.setItem(SESSION_KEY, { queue: sessionItems, index: currentIndex, createdAt: new Date().toISOString() });
    }

    deck = sessionItems.map((si) => words.find((w) => w.id === si.id)).filter(Boolean) as Word[];
  }

  onMount(async () => {
    words = await loadSeedWords();

    const savedStates = await browserStorage.getItem<Record<string, CardState>>(STATES_KEY);
    if (savedStates) states = savedStates;

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
    await saveStates();

    // If the user marked HARD, re-queue this card near the end of the session
    if (rating === 'hard') {
      const newItem: SessionItem = { id: word.id, mode: Math.random() < 0.5 ? 'ar2en' : 'en2ar' };
      sessionItems.push(newItem);
      deck.push(word);
    }

    // advance
    currentIndex += 1;

    // persist session metadata
    await browserStorage.setItem(SESSION_KEY, { queue: sessionItems, index: currentIndex, createdAt: new Date().toISOString() });
  }

  async function startNewSession() {
    await browserStorage.removeItem(SESSION_KEY);
    await buildSession(undefined);
  }
</script>

{#if loading}
  <p>Loading session…</p>
{:else}
  {#if currentIndex >= deck.length}
    <div class="card">
      <h3>Session complete</h3>
      <p>You studied {sessionNewCount} new words and reviewed {sessionReviewCount} due words.</p>
      <button on:click={startNewSession}>Start a new session</button>
    </div>
  {:else}
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:0.9rem;color:#666">Card {currentIndex + 1} of {deck.length}</div>
        <div style="font-size:0.9rem;color:#666">{sessionNewCount} new · {sessionReviewCount} review</div>
      </div>

      <Card word={deck[currentIndex]} mode={sessionItems[currentIndex]?.mode || 'ar2en'} on:rate={(e) => handleRate(e.detail)} />
    </div>
  {/if}
{/if}

<style>
  .card{margin-top:12px}
  button{padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#fff;cursor:pointer}
</style>
