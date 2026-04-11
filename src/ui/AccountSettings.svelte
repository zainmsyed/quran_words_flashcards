<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { changePassword, type AuthSession } from '../core/pocketbase-auth';
  import ChangePasswordForm from './ChangePasswordForm.svelte';

  export let authSession: AuthSession | null = null;
  export let userEmail: string | null = null;

  const dispatch = createEventDispatcher<{
    sessionchange: AuthSession;
  }>();

  let changeBusy = false;
  let changeError = '';
  let changeSuccess = '';
  let changeFormKey = 0;

  async function handleChangePassword(event: CustomEvent<{ currentPassword: string; nextPassword: string; confirmPassword: string }>) {
    if (!authSession) return;

    if (event.detail.nextPassword !== event.detail.confirmPassword) {
      changeError = 'New passwords do not match.';
      changeSuccess = '';
      return;
    }

    changeBusy = true;
    changeError = '';
    changeSuccess = '';

    try {
      const nextSession = await changePassword(authSession, event.detail.currentPassword, event.detail.nextPassword);
      dispatch('sessionchange', nextSession);
      changeSuccess = 'Password updated and your session was refreshed.';
      changeFormKey += 1;
    } catch (error) {
      changeError = error instanceof Error ? error.message : 'Could not change your password.';
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
    background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(249,252,250,0.98));
    border-radius: 24px;
    border: 0.5px solid rgba(173, 179, 181, 0.15);
    box-shadow: 0 16px 32px rgba(0, 109, 75, 0.07);
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
    border-radius: 22px;
    border: 0.5px solid rgba(173, 179, 181, 0.14);
    background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,251,249,0.98));
    box-shadow: 0 10px 18px rgba(0, 109, 75, 0.04);
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
