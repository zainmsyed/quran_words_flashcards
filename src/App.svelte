<script lang="ts">
  import StudySession from './ui/StudySession.svelte';
  import VoiceSettings from './ui/VoiceSettings.svelte';
  let showVoiceSettings = false;
</script>

<main>
  <header style="display:flex;align-items:center;justify-content:space-between;gap:12px">
    <h1>Quranic Flashcards — POC</h1>
    <div>
      <button on:click={() => showVoiceSettings = !showVoiceSettings} aria-expanded={showVoiceSettings} aria-controls="voice-settings">Voice</button>
    </div>
  </header>

  {#if showVoiceSettings}
    <section id="voice-settings" style="margin-top:12px">
      <VoiceSettings />
    </section>
  {/if}

  <section style="margin-top:12px">
    <StudySession />
  </section>
</main>

<style>
  h1{margin:0 0 12px 0}
  button{padding:8px 10px;border-radius:6px;border:1px solid #ddd;background:#fff;cursor:pointer}
</style>
