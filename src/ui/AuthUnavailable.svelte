<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let busy = false;
  export let message = 'PocketBase could not be reached.';

  const dispatch = createEventDispatcher<{ retry: undefined }>();
</script>

<section class="auth-shell">
  <div class="status-card status-panel">
    <div class="status-icon" aria-hidden="true">!</div>
    <div class="status-eyebrow">Service unavailable</div>
    <h1>Study is temporarily unavailable</h1>
    <p>{message}</p>
    <button class="retry-btn" type="button" disabled={busy} on:click={() => dispatch('retry')}>
      {busy ? 'Retrying…' : 'Retry connection'}
    </button>
  </div>
</section>

<style>
  .auth-shell {
    width: 100%;
    min-height: 100%;
    display: grid;
    place-items: center;
    padding: 1rem 0;
  }

  .status-card {
    width: min(100%, 32rem);
    padding: clamp(1.4rem, 4vw, 2rem);
    border-radius: 28px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(249, 252, 250, 0.97));
    border: 0.5px solid rgba(173, 179, 181, 0.15);
    box-shadow: 0 24px 48px rgba(0, 109, 75, 0.08);
    text-align: center;
  }

  .status-icon {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 0.95rem;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: rgba(213, 247, 236, 0.98);
    color: var(--primary);
    font-weight: 900;
    font-size: 1.2rem;
  }

  .status-eyebrow {
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--primary);
  }

  h1 {
    margin: 0.85rem 0 0;
    font-family: 'Manrope', sans-serif;
    font-size: clamp(1.8rem, 4.5vw, 2.4rem);
    line-height: 1;
    letter-spacing: -0.05em;
    color: var(--text);
  }

  p {
    margin: 0.85rem 0 0;
    color: var(--text-secondary);
    line-height: 1.65;
  }

  .retry-btn {
    min-width: 12rem;
    min-height: 56px;
    margin-top: 1.4rem;
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
