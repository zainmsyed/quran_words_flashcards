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
    border-radius: 6px;
    background: var(--card);
    border: 0.5px solid var(--border);
    box-shadow: var(--shadow-primary);
    text-align: center;
  }

  .status-icon {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 0.95rem;
    border-radius: 6px;
    display: grid;
    place-items: center;
    background: var(--primary-container);
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
    font-family: 'Space Grotesk', sans-serif;
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
    border-radius: 6px;
    background: var(--primary);
    color: var(--on-primary);
    font-size: 0.92rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: var(--shadow-primary);
  }

  .retry-btn:hover {
    background: var(--primary-dim);
    opacity: 1;
    transform: none;
  }
</style>
