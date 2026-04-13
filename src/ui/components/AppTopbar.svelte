<script lang="ts">
  export let buttonIcon: 'menu' | 'back' = 'menu';
  export let buttonLabel = '';
  export let onAction: () => void = () => {};
</script>

<header class="app-topbar session-header">
  <div class="brand" aria-label="alif">
    <div class="brand-mark" aria-hidden="true">
      <img src="/images/favicon.svg" alt="" aria-hidden="true" />
    </div>
    <div class="brand-copy">
      <h1>ALIF</h1>
    </div>
  </div>

  <button class="nav-btn" type="button" on:click={onAction} aria-label={buttonLabel}>
    {#if buttonIcon === 'menu'}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.5 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    {/if}
  </button>
</header>
