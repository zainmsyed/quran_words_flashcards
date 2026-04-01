<script lang="ts">
  import StudySession from './ui/StudySession.svelte';
  import Settings from './ui/Settings.svelte';

  let currentPage: 'study' | 'settings' = 'study';
</script>

<main class="app-shell">
  <header class="app-topbar">
    <div class="brand">
      <div class="brand-mark">📖</div>
      <div class="brand-copy">
        <p>Quranic Arabic</p>
      </div>
    </div>
    <button class="action-btn tertiary" aria-label="Toggle settings" on:click={() => currentPage = currentPage === 'settings' ? 'study' : 'settings'}>
      {currentPage === 'study' ? 'Settings' : 'Back to study'}
    </button>
  </header>

  {#if currentPage === 'study'}
    <section class="screen active study-shell">
      <StudySession />
    </section>
  {:else}
    <section class="screen active settings-screen">
      <Settings on:close={() => currentPage = 'study'} />
    </section>
  {/if}
</main>
