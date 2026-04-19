<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { changePassword, describePocketBaseError, PocketBaseAuthError, type AuthSession } from '../core/pocketbase-auth';
  import ChangePasswordForm from './ChangePasswordForm.svelte';

  export let authSession: AuthSession | null = null;
  export let userEmail: string | null = null;

  const dispatch = createEventDispatcher<{
    sessionchange: AuthSession;
    sessionissue: {
      code: 'unauthorized' | 'unavailable';
      message: string;
    };
  }>();

  let changeBusy = false;
  let changeError = '';
  let changeSuccess = '';
  let changeFormKey = 0;

  async function handleChangePassword(event: CustomEvent<{ currentPassword: string; nextPassword: string; confirmPassword: string }>) {
    if (!authSession) return;

    changeBusy = true;
    changeError = '';
    changeSuccess = '';

    try {
      const nextSession = await changePassword(authSession, event.detail.currentPassword, event.detail.nextPassword);
      dispatch('sessionchange', nextSession);
      changeSuccess = 'Password updated and your session was refreshed.';
      changeFormKey += 1;
    } catch (error) {
      if (error instanceof PocketBaseAuthError && (error.code === 'unauthorized' || error.code === 'unavailable')) {
        dispatch('sessionissue', {
          code: error.code,
          message: describePocketBaseError(error, {
            fallback: error.code === 'unauthorized'
              ? 'Your session expired. Please sign in again.'
              : 'PocketBase could not be reached.',
            unauthorized: 'Your session expired. Please sign in again.',
            unavailable: 'PocketBase could not be reached.',
          }),
        });
        return;
      }

      changeError = describePocketBaseError(error, {
        fallback: 'Could not change your password. Please try again.',
        'invalid-credentials': 'Current password was not accepted.',
        unauthorized: 'Your session expired. Please sign in again.',
        unavailable: 'PocketBase could not be reached.',
      });
    } finally {
      changeBusy = false;
    }
  }
</script>

<section class="settings-card account-settings">
  <div class="panel-heading">
    <div class="eyebrow">Account</div>
    <h2>Profile & password</h2>
    <p>Manage your invited account and update your password directly in the app.</p>
  </div>

  <div class="profile-card">
    <div class="profile-label">Signed in as</div>
    <div class="profile-email">{userEmail || authSession?.user.email || 'PocketBase user'}</div>
    <div class="profile-note">Invite-only access: create and manage users manually in the PocketBase admin dashboard.</div>
  </div>

  <div class="account-stack">
    {#key changeFormKey}
      <ChangePasswordForm
        busy={changeBusy}
        error={changeError}
        success={changeSuccess}
        on:submit={handleChangePassword}
      />
    {/key}
  </div>
</section>

<style>
  .settings-card {
    background: var(--card);
    border-radius: var(--radius-md);
    border: 0.5px solid var(--border);
    box-shadow: var(--shadow-primary);
    padding: 1.4rem;
  }

  .panel-heading {
    margin-bottom: 1rem;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--primary);
    margin-bottom: 0.35rem;
  }

  .panel-heading h2 {
    margin: 0 0 0.35rem 0;
    font-family: 'Manrope', sans-serif;
    font-size: clamp(1.45rem, 3vw, 2rem);
    line-height: 1;
    letter-spacing: -0.04em;
    color: var(--text);
  }

  .panel-heading p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .profile-card {
    padding: 1rem 1.05rem;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--border);
    background: var(--bg-secondary);
    box-shadow: var(--shadow-primary);
    margin-bottom: 1rem;
  }

  .profile-label {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--primary);
    margin-bottom: 0.35rem;
  }

  .profile-email {
    font-family: 'Manrope', sans-serif;
    font-size: 1.1rem;
    font-weight: 900;
    color: var(--text);
    word-break: break-word;
  }

  .profile-note {
    margin-top: 0.55rem;
    color: var(--text-secondary);
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .account-stack {
    display: grid;
    gap: 1rem;
  }

  @media (max-width: 720px) {
    .settings-card {
      padding: 1.15rem;
    }
  }
</style>
