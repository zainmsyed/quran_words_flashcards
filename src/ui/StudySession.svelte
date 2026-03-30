<script lang="ts">
  import { onMount } from 'svelte';
  import Card from './components/Card.svelte';
  import { loadSeedWords, Word } from '../core/wordlist';
  import { browserStorage } from '../core/storage-adapter';
  import { initialCardState, applyRatingToCard, CardState } from '../core/srs';

  const STORAGE_KEY = 'qfc2_states';

  let words: Word[] = [];
  let deck: Word[] = [];
  let currentIndex = 0;
  let states: Record<string, CardState> = {};

  onMount(async () => {
    words = await loadSeedWords();
    deck = words.slice(0, 10);
    const saved = await browserStorage.getItem<Record<string, CardState>>(STORAGE_KEY);
    if (saved) states = saved;
  });

  function getStateFor(id: string) {
    if (!states[id]) states[id] = initialCardState(id);
    return states[id];
  }

  async function handleRate(rating: 'hard' | 'got' | 'easy') {
    const word = deck[currentIndex];
    if (!word) return;
    const prev = getStateFor(word.id);
    const updated = applyRatingToCard(prev, rating);
    states[word.id] = updated;
    await browserStorage.setItem(STORAGE_KEY, states);
    // move to next card
    if (currentIndex < deck.length - 1) currentIndex += 1;
  }
</script>

{#if deck.length === 0}
  <p>Loading session…</p>
{:else}
  <div class="card">
    <Card word={deck[currentIndex]} on:rate={(e) => handleRate(e.detail)} />
    <div style="margin-top:12px;font-size:0.9rem;color:#666">
      Card {currentIndex + 1} of {deck.length}
    </div>
  </div>
{/if}

<style>
  .card{margin-top:12px}
</style>
