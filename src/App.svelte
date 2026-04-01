<script lang="ts">
  import StudySession from './ui/StudySession.svelte';
  import Settings from './ui/Settings.svelte';

  let currentPage: 'study' | 'settings' = 'study';
</script>

<main class="app-shell">
  {#if currentPage === 'study'}
    <section class="screen active study-screen">
      <StudySession on:openSettings={() => (currentPage = 'settings')} />
    </section>
  {:else}
    <section class="screen active settings-screen">
      <Settings on:close={() => (currentPage = 'study')} />
    </section>
  {/if}
</main>
