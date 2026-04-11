<script lang="ts">
  import { onMount } from 'svelte';
  import StudySession from './ui/StudySession.svelte';
  import Settings from './ui/Settings.svelte';
  import AuthGate from './ui/AuthGate.svelte';
  import AuthUnavailable from './ui/AuthUnavailable.svelte';
  import {
    type AuthSession,
    type PocketBaseAuthError,
    initializeAuth,
    signInWithPassword,
    signOut,
  } from './core/pocketbase-auth';

  let currentPage: 'study' | 'settings' = 'study';
  let appState: 'booting' | 'login' | 'unavailable' | 'ready' = 'booting';
  let authBusy = false;
  let authError = '';
  let unavailableMessage = 'PocketBase could not be reached.';
  let session: AuthSession | null = null;

  onMount(() => {
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
      if (result.status === 'unavailable') {
        unavailableMessage = result.message;
        appState = 'unavailable';
        return;
      }

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
      if (authIssue?.code === 'unavailable') {
        unavailableMessage = authIssue.message;
        appState = 'unavailable';
      } else {
        authError = authIssue?.message || 'Could not sign in. Please try again.';
        appState = 'login';
      }
      session = null;
    } finally {
      authBusy = false;
    }
  }

  async function handleSignOut() {
    authBusy = true;
    try {
      await signOut();
      session = null;
      currentPage = 'study';
      authError = '';
      appState = 'login';
    } finally {
      authBusy = false;
    }
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
      <StudySession on:openSettings={() => (currentPage = 'settings')} />
    </section>
  {:else}
    <section class="screen active settings-screen">
      <Settings
        userEmail={session?.user.email || null}
        signOutBusy={authBusy}
        on:close={() => (currentPage = 'study')}
        on:logout={handleSignOut}
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

  .app-loading-card {
    width: min(100%, 28rem);
    min-height: 14rem;
    margin: auto;
    display: grid;
    place-items: center;
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(249, 252, 250, 0.97));
    border: 0.5px solid rgba(173, 179, 181, 0.15);
    box-shadow: 0 24px 48px rgba(0, 109, 75, 0.08);
  }

  .app-loading-card p {
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
</style>
