<script lang="ts">
  import { onMount } from 'svelte';
  import StudySession from './ui/StudySession.svelte';
  import Settings from './ui/Settings.svelte';
  import AuthGate from './ui/AuthGate.svelte';
  import AuthUnavailable from './ui/AuthUnavailable.svelte';
  import {
    describePocketBaseError,
    initializeAuth,
    type AuthSession,
    PocketBaseAuthError,
    signInWithPassword,
    signOut,
  } from './core/pocketbase-auth';
  import { stop } from './core/tts-adapter';

  let currentPage: 'study' | 'settings' = 'study';
  let settingsInitialTab: 'stats' | 'account' | 'voice' | 'words' = 'stats';
  let appState: 'booting' | 'login' | 'unavailable' | 'ready' = 'booting';
  let authBusy = false;
  let authError = '';
  let unavailableMessage = 'PocketBase could not be reached.';
  let session: AuthSession | null = null;

  type SessionIssueDetail = {
    code: 'unauthorized' | 'unavailable';
    message: string;
  };

  onMount(() => {
    if (typeof window !== 'undefined') {
      if (window.history && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }
    void bootstrapAuth();
  });

  async function bootstrapAuth() {
    authBusy = true;
    authError = '';

    try {
      const result = await initializeAuth();
      if (result.status === 'authenticated') {
        session = result.session;
        currentPage = 'study';
        appState = 'ready';
        return;
      }

      session = null;
      currentPage = 'study';
      if (result.status === 'unavailable') {
        unavailableMessage = result.message || 'PocketBase could not be reached.';
        appState = 'unavailable';
        return;
      }

      appState = 'login';
    } catch (error) {
      console.warn(error);
      session = null;
      currentPage = 'study';
      authError = 'Could not verify your session. Please sign in again.';
      appState = 'login';
    } finally {
      authBusy = false;
    }
  }

  async function handleSignIn(event: CustomEvent<{ email: string; password: string }>) {
    authBusy = true;
    authError = '';

    try {
      session = await signInWithPassword(event.detail.email, event.detail.password);
      currentPage = 'study';
      appState = 'ready';
    } catch (error) {
      const authIssue = error as PocketBaseAuthError | undefined;
      session = null;
      currentPage = 'study';

      if (authIssue instanceof PocketBaseAuthError && authIssue.code === 'unavailable') {
        unavailableMessage = 'PocketBase could not be reached.';
        authError = '';
        appState = 'unavailable';
      } else {
        authError = describePocketBaseError(error, {
          fallback: 'Could not sign in. Please try again.',
          'invalid-credentials': 'Invalid email or password.',
          unauthorized: 'Your session expired. Please sign in again.',
          unavailable: 'PocketBase could not be reached.',
        });
        appState = 'login';
      }
    } finally {
      authBusy = false;
    }
  }

  async function handleSignOut() {
    authBusy = true;
    stop();
    session = null;
    currentPage = 'study';
    settingsInitialTab = 'stats';
    authError = '';
    appState = 'login';

    try {
      await signOut();
    } finally {
      authBusy = false;
    }
  }

  async function handleSessionIssue(event: CustomEvent<SessionIssueDetail>) {
    stop();
    session = null;
    currentPage = 'study';
    settingsInitialTab = 'stats';
    authError = '';

    if (event.detail.code === 'unauthorized') {
      authBusy = true;
      appState = 'login';
      authError = event.detail.message || 'Your session expired. Please sign in again.';

      try {
        await signOut();
      } finally {
        authBusy = false;
      }

      return;
    }

    unavailableMessage = event.detail.message || 'PocketBase could not be reached.';
    appState = 'unavailable';
  }

  async function handleSessionChange(event: CustomEvent<AuthSession>) {
    session = event.detail;
  }
</script>

<main class="app-shell">
  {#if appState === 'booting'}
    <section class="screen active auth-screen">
      <div class="app-loading-card">
        <p>Checking PocketBase…</p>
      </div>
    </section>
  {:else if appState === 'unavailable'}
    <section class="screen active auth-screen">
      <AuthUnavailable busy={authBusy} message={unavailableMessage} on:retry={bootstrapAuth} />
    </section>
  {:else if appState === 'login'}
    <section class="screen active auth-screen">
      <AuthGate busy={authBusy} error={authError} on:signin={handleSignIn} />
    </section>
  {:else if currentPage === 'study'}
    <section class="screen active study-screen">
      <StudySession authSession={session} on:openSettings={(e) => { currentPage = 'settings'; settingsInitialTab = (e?.detail?.tab) ?? 'stats'; }} on:sessionissue={handleSessionIssue} />
    </section>
  {:else}
    <section class="screen active settings-screen">
      <Settings
        authSession={session}
        userEmail={session?.user.email || null}
        signOutBusy={authBusy}
        on:close={() => { currentPage = 'study'; settingsInitialTab = 'stats'; }}
        on:logout={handleSignOut}
        on:sessionchange={handleSessionChange}
        initialTab={settingsInitialTab}
        on:sessionissue={handleSessionIssue}
      />
    </section>
  {/if}
</main>

<style>
  .auth-screen {
    display: flex;
    justify-content: center;
    align-items: stretch;
  }

  .study-screen {
    display: flex;
    justify-content: center;
    align-items: stretch;
    width: 100%;
  }

  .app-loading-card {
    width: min(100%, 28rem);
    min-height: 14rem;
    margin: auto;
    display: grid;
    place-items: center;
    border-radius: 6px;
    background: var(--card);
    border: 0.5px solid var(--border);
    box-shadow: var(--shadow-primary);
  }

  .app-loading-card p {
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
</style>
