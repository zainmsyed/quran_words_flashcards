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

  function submit() {
    dispatch('submit', {
      currentPassword,
      nextPassword,
      confirmPassword,
    });
  }
</script>

<section class="change-password-panel">
  <div class="panel-heading">
    <div class="eyebrow">Account password</div>
    <h2>Change password</h2>
    <p>Use your current password to set a new one for this invite.</p>
  </div>

  <form class="change-form" on:submit|preventDefault={submit}>
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

    {#if error}
      <div class="feedback error" role="alert">{error}</div>
    {/if}

    {#if success}
      <div class="feedback success" role="status">{success}</div>
    {/if}

    <button class="submit-btn" type="submit" disabled={busy}>
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
    border-radius: 18px;
    border: 0.5px solid rgba(173, 179, 181, 0.2);
    background: rgba(255, 255, 255, 0.94);
    color: var(--text);
    font: inherit;
    box-shadow: inset 0 1px 2px rgba(12, 20, 18, 0.03);
  }

  .field input:focus {
    outline: 2px solid rgba(0, 109, 75, 0.16);
    border-color: rgba(0, 109, 75, 0.22);
  }

  .feedback {
    padding: 0.85rem 0.95rem;
    border-radius: 18px;
    font-size: 0.92rem;
    line-height: 1.5;
    font-weight: 700;
  }

  .feedback.error {
    background: rgba(255, 240, 240, 0.96);
    color: #ad4f4f;
    border: 0.5px solid rgba(208, 121, 121, 0.18);
  }

  .feedback.success {
    background: rgba(235, 252, 240, 0.98);
    color: #167054;
    border: 0.5px solid rgba(164, 229, 205, 0.8);
  }

  .submit-btn {
    min-height: 54px;
    margin-top: 0.05rem;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dim));
    color: var(--on-primary);
    font-size: 0.92rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 16px 26px rgba(0, 109, 75, 0.16);
  }
</style>
