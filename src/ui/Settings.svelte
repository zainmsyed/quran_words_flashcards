<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import AppTopbar from './components/AppTopbar.svelte';
  import Stats from './Stats.svelte';
  import AccountSettings from './AccountSettings.svelte';
  import VoiceSettings from './VoiceSettings.svelte';
  import WordList from './WordList.svelte';
  import { loadSeedWords, type Word } from '../core/wordlist';
  import type { CardState } from '../core/srs';
  import type { AppStats } from '../core/app-stats';
  import type { AuthSession } from '../core/pocketbase-auth';
  import {
    clearLegacyStudyStorage,
    loadAuthenticatedStudySnapshot,
  } from '../core/pocketbase-study';
  import { summarizeStudyProgress } from '../core/progress-summary';

  export let authSession: AuthSession | null = null;
  export let userEmail: string | null = null;
  export let signOutBusy = false;

  const dispatch = createEventDispatcher<{
    close: undefined;
    logout: undefined;
    sessionchange: AuthSession;
  }>();

  let tab: 'stats' | 'account' | 'voice' | 'words' = 'stats';
  let words: Word[] = [];
  let states: Record<string, CardState> = {};
  let appStats: AppStats = { studied: 0, easy: 0, streak: 0, lastStudyDate: undefined };
  let loading = true;
  let loadError = '';

  async function retryLoad() {
    loading = true;
    loadError = '';
    try {
      if (!authSession) {
        throw new Error('Missing PocketBase session.');
      }

      words = await loadSeedWords();
      const snapshot = await loadAuthenticatedStudySnapshot(authSession, words);
      states = snapshot.states;

      const summary = summarizeStudyProgress(words, states, new Date());
      appStats = {
        ...snapshot.appStats,
        studied: summary.seenWords,
        easy: summary.easyCount,
      };

      await clearLegacyStudyStorage();
    } catch (error) {
      console.warn(error);
      loadError = 'Could not load your PocketBase settings data.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    void retryLoad();
  });

  function close() {
    dispatch('close');
  }

  function logout() {
    dispatch('logout');
  }

  function handleSessionChange(event: CustomEvent<AuthSession>) {
    dispatch('sessionchange', event.detail);
  }
</script>

<section class="settings-shell" class:stats-bleed={tab === 'stats'}>
  <AppTopbar buttonIcon="back" buttonLabel="Return to study" onAction={close} />

  <div class="settings-body">
    <div class="account-box" role="region" aria-label="Account">
      <div class="account-inner">
        <div class="settings-copy">
          <div class="settings-eyebrow">Signed in</div>
          <div class="settings-user">{userEmail || 'PocketBase user'}</div>
        </div>
        <button class="action-btn primary signout-btn" type="button" on:click={logout} disabled={signOutBusy}>
          {signOutBusy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>

    <nav class="settings-tabs" aria-label="Settings sections">
    <button type="button" class="settings-tab action-btn" class:active={tab === 'stats'} aria-pressed={tab === 'stats'} on:click={() => tab = 'stats'}>Stats</button>
    <button type="button" class="settings-tab action-btn" class:active={tab === 'account'} aria-pressed={tab === 'account'} on:click={() => tab = 'account'}>Account</button>
    <button type="button" class="settings-tab action-btn" class:active={tab === 'voice'} aria-pressed={tab === 'voice'} on:click={() => tab = 'voice'}>Audio</button>
    <button type="button" class="settings-tab action-btn" class:active={tab === 'words'} aria-pressed={tab === 'words'} on:click={() => tab = 'words'}>Words</button>
  </nav>

  <div class="settings-content">
    {#if loading}
      <div class="settings-loading">Loading…</div>
    {:else if loadError && words.length === 0}
      <div class="settings-error" role="alert">
        <p>{loadError}</p>
        <button type="button" class="action-btn primary settings-retry-btn" on:click={retryLoad}>Retry</button>
      </div>
    {:else}
      {#if loadError}
        <div class="settings-error compact" role="alert">{loadError}</div>
      {/if}

      {#if tab === 'stats'}
        <Stats {words} {states} appStats={appStats} />
      {:else if tab === 'account'}
        <AccountSettings {authSession} {userEmail} on:sessionchange={handleSessionChange} />
      {:else if tab === 'voice'}
        <VoiceSettings />
      {:else}
        <WordList {words} {states} />
      {/if}
    {/if}
  </div>
</div>
</section>

<style>
  .settings-shell {
    --session-gutter: clamp(1.25rem, 3.5vw, 2.5rem);
    width: 100%;
    min-height: 100%;
    margin: 0 auto;
    padding: 0;
    display: flex;
    flex-direction: column;
    border-radius: 0;
    background: transparent;
    border: 0;
    box-shadow: none;
    overflow: visible;
  }

  /* The body contains the carded content (tabs + content) */
  .settings-body {
    background: var(--card);
    border-radius: 6px;
    border: 0.5px solid var(--border);
    box-shadow: var(--shadow-primary);
    padding: 1rem 0 1.1rem;
    overflow: hidden;
  }

  /* Account box shown below the header on the Stats tab */
  .account-box {
    background: var(--card);
    border-top: 0.5px solid var(--border);
    box-shadow: none;
  }

  .account-inner {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.9rem var(--session-gutter);
  }

  .account-inner .settings-copy { flex: 1 1 auto; }

  @media (max-width: 720px) {
    .account-inner { flex-direction: column; align-items: flex-start; gap: 0.35rem; }
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
    min-height: 50px;
    padding: 0.8rem 1rem;
    border-radius: 6px;
    background: var(--primary);
    color: var(--on-primary);
    border: 0;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    box-shadow: var(--shadow-primary);
  }

  .signout-btn:hover {
    background: var(--primary-dim);
    opacity: 1;
    transform: none;
  }

  .settings-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
    padding-inline: var(--session-gutter);
    margin-top: 1rem;
  }

  .settings-tab {
    appearance: none;
    width: 100%;
    min-height: 54px;
    padding: 0.9rem 1rem;
    border-radius: 6px;
    border: 0.5px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-family: 'Work Sans', sans-serif;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    box-shadow: var(--shadow-primary);
  }

  .settings-tab.active {
    background: var(--primary);
    color: var(--on-primary);
    border-color: var(--primary);
    box-shadow: var(--shadow-primary);
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

  .settings-error {
    padding: 0.95rem 1rem;
    border-radius: 6px;
    background: rgba(255, 240, 240, 0.96);
    color: #ad4f4f;
    border: 0.5px solid rgba(208, 121, 121, 0.18);
    font-size: 0.92rem;
    line-height: 1.5;
    font-weight: 700;
    margin-bottom: 0.85rem;
  }

  .settings-error p {
    margin: 0;
  }

  .settings-retry-btn {
    min-height: 44px;
    margin-top: 0.9rem;
    padding: 0.7rem 1rem;
    border: 0;
    border-radius: 6px;
    background: var(--primary);
    color: var(--on-primary);
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: var(--shadow-primary);
  }

  .settings-retry-btn:hover {
    background: var(--primary-dim);
    opacity: 1;
    transform: none;
  }

  .settings-error.compact {
    margin-bottom: 0.85rem;
  }

  @media (max-width: 720px) {
    .settings-copy {
      min-width: 100%;
    }

    .signout-btn {
      width: 100%;
    }

    .settings-tabs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .settings-tab {
      min-height: 50px;
      padding-inline: 0.7rem;
      font-size: 12px;
      letter-spacing: 0.1em;
    }
  }
</style>
