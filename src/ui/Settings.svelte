<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import Stats from './Stats.svelte';
  import VoiceSettings from './VoiceSettings.svelte';
  import WordList from './WordList.svelte';
  import { loadSeedWords } from '../core/wordlist';
  import { browserStorage } from '../core/storage-adapter';
  import { normalizeCardState } from '../core/srs';
  import type { CardState } from '../core/srs';
  import type { AppStats } from '../core/app-stats';

  const STATES_KEY = 'qfc2_states';
  const STATS_KEY = 'qfc2_stats';

  export let userEmail: string | null = null;
  export let signOutBusy = false;

  const dispatch = createEventDispatcher();

  let tab: 'stats' | 'voice' | 'words' = 'stats';
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

  function logout() {
    dispatch('logout');
  }
</script>

<section class="settings-panel settings-shell">
  <header class="settings-head">
    <button class="nav-btn" type="button" on:click={close} aria-label="Return to study">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.5 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div class="settings-copy">
      <div class="settings-eyebrow">Signed in</div>
      <div class="settings-user">{userEmail || 'PocketBase user'}</div>
    </div>

    <button class="signout-btn" type="button" on:click={logout} disabled={signOutBusy}>
      {signOutBusy ? 'Signing out…' : 'Sign out'}
    </button>
  </header>

  <nav class="settings-tabs" aria-label="Settings sections">
    <button type="button" class="settings-tab" class:active={tab === 'stats'} aria-pressed={tab === 'stats'} on:click={() => tab = 'stats'}>Stats</button>
    <button type="button" class="settings-tab" class:active={tab === 'voice'} aria-pressed={tab === 'voice'} on:click={() => tab = 'voice'}>Audio</button>
    <button type="button" class="settings-tab" class:active={tab === 'words'} aria-pressed={tab === 'words'} on:click={() => tab = 'words'}>Words</button>
  </nav>

  <div class="settings-content">
    {#if loading}
      <div class="settings-loading">Loading…</div>
    {:else}
      {#if tab === 'stats'}
        <Stats {words} {states} appStats={appStats} />
      {:else if tab === 'voice'}
        <VoiceSettings />
      {:else}
        <WordList {words} {states} />
      {/if}
    {/if}
  </div>
</section>

<style>
  .settings-shell {
    --session-gutter: clamp(1.25rem, 3.5vw, 2.5rem);
    padding: 1rem 0 1.1rem;
    display: flex;
    flex-direction: column;
    border-radius: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 253, 251, 0.96));
    border: 1px solid rgba(255, 255, 255, 0.72);
    box-shadow: 0 28px 60px rgba(0, 0, 0, 0.35);
    overflow: hidden;
  }

  .settings-head {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding-inline: var(--session-gutter);
  }

  .nav-btn {
    width: 46px;
    height: 46px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgba(213, 247, 236, 0.98);
    color: #12805b;
    box-shadow: 0 8px 20px rgba(18, 120, 82, 0.06);
  }

  .nav-btn svg {
    width: 18px;
    height: 18px;
  }

  .settings-copy {
    min-width: 0;
    flex: 1 1 auto;
  }

  .settings-eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--primary);
  }

  .settings-user {
    margin-top: 0.2rem;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.4;
    word-break: break-word;
  }

  .signout-btn {
    min-height: 46px;
    padding: 0.8rem 1rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    color: var(--primary);
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    box-shadow: 0 8px 20px rgba(18, 120, 82, 0.06);
  }

  .settings-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    padding-inline: var(--session-gutter);
    margin-top: 1rem;
  }

  .settings-tab {
    appearance: none;
    width: 100%;
    min-height: 54px;
    padding: 0.9rem 1rem;
    border-radius: 999px;
    border: 0.5px solid rgba(173, 179, 181, 0.14);
    background: rgba(255, 255, 255, 0.88);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    box-shadow: 0 10px 20px rgba(0, 109, 75, 0.05);
  }

  .settings-tab.active {
    background: var(--primary-container);
    color: var(--primary);
    border-color: rgba(0, 109, 75, 0.12);
    box-shadow: 0 12px 24px rgba(0, 109, 75, 0.08);
  }

  .settings-content {
    flex: 1;
    width: 100%;
    min-width: 0;
    margin-top: 1rem;
    padding-inline: var(--session-gutter);
  }

  .settings-loading {
    padding: 1rem;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  @media (max-width: 720px) {
    .settings-shell {
      padding: 0.95rem 0 1rem;
      border-radius: 20px;
    }

    .settings-head {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .signout-btn {
      width: 100%;
    }

    .settings-tab {
      min-height: 50px;
      padding-inline: 0.7rem;
      font-size: 12px;
      letter-spacing: 0.1em;
    }
  }
</style>
