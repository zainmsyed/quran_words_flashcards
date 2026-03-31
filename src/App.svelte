<script lang="ts">
  import StudySession from './ui/StudySession.svelte';
  import Settings from './ui/Settings.svelte';

  let currentPage: 'study' | 'settings' = 'study';
</script>

<main>
  <header class="topbar">
    <h1>Quranic Arabic</h1>
    <div>
      <button class="action-btn" aria-label="Toggle settings" on:click={() => currentPage = currentPage === 'settings' ? 'study' : 'settings'}>☰</button>
    </div>
  </header>

  {#if currentPage === 'study'}
    <section class="screen active">
      <div class="panel">
        <StudySession />
      </div>
    </section>
  {:else}
    <section class="screen active">
      <Settings on:close={() => currentPage = 'study'} />
    </section>
  {/if}
</main>
