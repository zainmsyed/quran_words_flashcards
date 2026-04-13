<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let busy = false;
  export let error = '';

  const dispatch = createEventDispatcher<{
    signin: { email: string; password: string };
  }>();

  let email = '';
  let password = '';

  function submit() {
    dispatch('signin', {
      email,
      password,
    });
  }
</script>

<section class="auth-shell">

  <div class="auth-card auth-panel">
    <div class="brand auth-brand" aria-label="alif">
      <div class="brand-mark" aria-hidden="true"><img src="/images/favicon.svg" alt="" aria-hidden="true"/></div>
      <div class="brand-copy">
        <h1>ALIF</h1>
      </div>
    </div>
    <p class="auth-copy">Sign in with your invited account to open the study app.</p>

    <form class="auth-form" on:submit|preventDefault={submit}>
      <label class="field">
        <span>Email</span>
        <input type="email" bind:value={email} autocomplete="email" placeholder="you@example.com" required />
      </label>

      <label class="field">
        <span>Password</span>
        <input type="password" bind:value={password} autocomplete="current-password" placeholder="Enter your password" required />
      </label>

      {#if error}
        <div class="auth-feedback error" role="alert">{error}</div>
      {/if}

      <button class="submit-btn" type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  </div>
</section>

<style>
  .auth-shell {
    position: relative;
    width: 100%;
    min-height: 100%;
    display: grid;
    place-items: center;
    padding: 1rem 0;
    overflow: hidden;

    /* background: compressed WebP for smallest delivery and cropping behavior */
    background-image: url('/images/auth-background.webp');
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
  }

  .auth-card {
    position: relative;
    z-index: 1;
    width: min(100%, 32rem);
    padding: clamp(1.4rem, 4vw, 2rem);
    border-radius: 6px;
    background: var(--card);
    border: 0.5px solid var(--border);
    box-shadow: var(--shadow-primary);
  }

  .auth-brand {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.85rem;
    margin-bottom: 0.8rem;
    text-align: center;
    width: 100%;
  }

  .auth-brand .brand-mark {
    width: 4.8rem;
    height: 4.8rem;
    display: grid;
    place-items: center;
    font-size: 2.6rem;
  }

  h1 {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(2.8rem, 6vw, 4rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--text);
  }

  .auth-copy {
    margin: 0.6rem 0 0;
    color: var(--text-secondary);
    line-height: 1.65;
    text-align: center;
  }

  .auth-form {
    display: grid;
    gap: 1rem;
    margin-top: 1.4rem;
  }

  .field {
    display: grid;
    gap: 0.45rem;
  }

  .field span {
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .field input {
    width: 100%;
    min-height: 56px;
    padding: 0.95rem 1rem;
    border-radius: 6px;
    border: 0.5px solid var(--border);
    background: var(--card);
    color: var(--text);
    font: inherit;
    box-shadow: inset 0 1px 2px rgba(12, 20, 18, 0.03);
  }

  .field input:focus {
    outline: 2px solid rgba(214, 40, 40, 0.16);
    border-color: rgba(214, 40, 40, 0.22);
  }

  .auth-feedback {
    padding: 0.85rem 0.95rem;
    border-radius: 6px;
    font-size: 0.92rem;
    line-height: 1.5;
    font-weight: 700;
  }

  .auth-feedback.error {
    background: rgba(255, 240, 240, 0.96);
    color: #ad4f4f;
    border: 0.5px solid rgba(208, 121, 121, 0.18);
  }

  .submit-btn {
    min-height: 58px;
    margin-top: 0.25rem;
    border: 0;
    border-radius: 6px;
    background: var(--primary);
    color: var(--on-primary);
    font-size: 0.98rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: var(--shadow-primary);
  }

  .submit-btn:hover {
    background: var(--primary-dim);
    opacity: 1;
    transform: none;
  }


</style>
