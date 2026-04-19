<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let busy = false;
  export let error = '';
  export let success = '';

  const dispatch = createEventDispatcher<{
    submit: {
      currentPassword: string;
      nextPassword: string;
      confirmPassword: string;
    };
  }>();

  let currentPassword = '';
  let nextPassword = '';
  let confirmPassword = '';
  let localError = '';

  function submit() {
    if (nextPassword !== confirmPassword) {
      localError = 'New passwords do not match.';
      return;
    }

    const payload = {
      currentPassword,
      nextPassword,
      confirmPassword,
    };

    currentPassword = '';
    nextPassword = '';
    confirmPassword = '';
    localError = '';
    dispatch('submit', payload);
  }
</script>

<section class="change-password-panel">
  <div class="panel-heading">
    <div class="eyebrow">Account password</div>
    <h2>Change password</h2>
    <p>Use your current password to set a new one for this invite.</p>
  </div>

  <form class="change-form" on:submit|preventDefault={submit} on:input={() => (localError = '')}>
    <label class="field">
      <span>Current password</span>
      <input type="password" bind:value={currentPassword} autocomplete="current-password" placeholder="Current password" required />
    </label>

    <label class="field">
      <span>New password</span>
      <input type="password" bind:value={nextPassword} autocomplete="new-password" placeholder="New password" required />
    </label>

    <label class="field">
      <span>Confirm new password</span>
      <input type="password" bind:value={confirmPassword} autocomplete="new-password" placeholder="Confirm new password" required />
    </label>

    {#if localError}
      <div class="feedback error" role="alert">{localError}</div>
    {:else if error}
      <div class="feedback error" role="alert">{error}</div>
    {/if}

    {#if success}
      <div class="feedback success" role="status">{success}</div>
    {/if}

    <button class="action-btn primary submit-btn" type="submit" disabled={busy}>
      {busy ? 'Updating…' : 'Update password'}
    </button>
  </form>
</section>

<style>
  .change-password-panel {
    display: grid;
    gap: 1rem;
  }

  .panel-heading {
    margin-bottom: 0.25rem;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--primary);
    margin-bottom: 0.35rem;
  }

  h2 {
    margin: 0 0 0.35rem 0;
    font-family: 'Manrope', sans-serif;
    font-size: clamp(1.2rem, 2.8vw, 1.55rem);
    line-height: 1;
    letter-spacing: -0.04em;
    color: var(--text);
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .change-form {
    display: grid;
    gap: 0.9rem;
  }

  .field {
    display: grid;
    gap: 0.45rem;
  }

  .field span {
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .field input {
    width: 100%;
    min-height: 54px;
    padding: 0.9rem 1rem;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--border);
    background: var(--card);
    color: var(--text);
    font: inherit;
    box-shadow: inset 0 1px 2px rgba(12, 20, 18, 0.03);
  }

  .field input:focus {
    outline: 2px solid var(--primary);
    border-color: var(--primary);
  }

  .feedback {
    padding: 0.85rem 0.95rem;
    border-radius: var(--radius-md);
    font-size: 0.92rem;
    line-height: 1.5;
    font-weight: 700;
  }

  .feedback.error {
    background: var(--danger-bg);
    color: var(--danger-text);
    border-color: transparent;
  }

  .feedback.success {
    background: var(--success-bg);
    color: var(--success-text);
    border-color: transparent;
  }

  .submit-btn {
    min-height: 54px;
    margin-top: 0.05rem;
    border: 0;
    font-size: 0.92rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: var(--shadow-primary);
  }
</style>
