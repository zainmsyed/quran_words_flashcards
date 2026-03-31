<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import Stats from './Stats.svelte';
  import VoiceSettings from './VoiceSettings.svelte';
  import { loadSeedWords } from '../core/wordlist';
  import { browserStorage } from '../core/storage-adapter';
  import { normalizeCardState } from '../core/srs';
  import type { CardState } from '../core/srs';
  import type { AppStats } from '../core/app-stats';

  const STATES_KEY = 'qfc2_states';
  const STATS_KEY = 'qfc2_stats';

  const dispatch = createEventDispatcher();

  let tab: 'stats' | 'voice' = 'stats';
  let words: any[] = [];
  let states: Record<string, CardState> = {};
  let appStats: AppStats = { studied: 0, easy: 0, streak: 0, lastStudyDate: undefined };
  let loading = true;

  function normalizeStates(input: Record<string, CardState> | null | undefined) {
    const out: Record<string, CardState> = {};
    for (const [id, state] of Object.entries(input || {})) {
      out[id] = normalizeCardState({ id, ...state });
    }
    return out;
  }

  onMount(async () => {
    words = await loadSeedWords();
    const savedStates = await browserStorage.getItem<Record<string, CardState>>(STATES_KEY);
    states = normalizeStates(savedStates);
    const savedStats = await browserStorage.getItem<AppStats>(STATS_KEY);
    if (savedStats) appStats = savedStats;
    loading = false;
  });

  function close() {
    dispatch('close');
  }
</script>

<section class="panel settings-panel">
  <div class="topbar" style="margin-bottom: 1rem;">
    <h1>Settings</h1>
    <button class="action-btn" on:click={close} aria-label="Close settings">Back</button>
  </div>

  <div class="settings-layout">
    <nav class="settings-nav">
      <button class="action-btn" class:active={tab === 'stats'} on:click={() => tab = 'stats'}>Stats</button>
      <button class="action-btn" class:active={tab === 'voice'} on:click={() => tab = 'voice'}>Audio / Voice</button>
    </nav>

    <div class="settings-main">
      {#if loading}
        <p>Loading…</p>
      {:else}
        {#if tab === 'stats'}
          <Stats {words} {states} appStats={appStats} />
        {:else}
          <VoiceSettings />
        {/if}
      {/if}
    </div>
  </div>
</section>
