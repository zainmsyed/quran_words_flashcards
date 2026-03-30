<script lang="ts">
  import { onMount } from 'svelte';
  import { getAvailableVoices, isSupported, speak } from '../core/tts-adapter';
  import { browserStorage } from '../core/storage-adapter';

  const STORAGE_VOICE_KEY = 'qfc2_tts_voice';

  type VoiceItem = { name: string; lang: string; default?: boolean };

  let voices: VoiceItem[] = [];
  let loading = true;
  let supported = false;
  let selected: string | null = null;

  async function refresh() {
    loading = true;
    voices = await getAvailableVoices();
    loading = false;
  }

  onMount(async () => {
    supported = isSupported();
    await refresh();
    try { selected = await browserStorage.getItem<string>(STORAGE_VOICE_KEY); } catch (e) { selected = null; }
  });

  async function save() {
    try {
      if (selected) await browserStorage.setItem(STORAGE_VOICE_KEY, selected);
      else await browserStorage.removeItem(STORAGE_VOICE_KEY);
      alert('Saved voice preference.');
    } catch (e) {
      console.warn('Save voice failed', e);
    }
  }

  async function playSample() {
    if (!supported) return;
    // sample Arabic phrase and its transliteration fallback will be used if needed
    try {
      if (selected) await speak('بِسْمِ اللَّهِ الرَّحْمَٰنِ', { voice: selected, lang: 'ar-SA', rate: 0.9, fallbackLang: 'en-US' });
      else await speak('بِسْمِ اللَّهِ الرَّحْمَٰنِ', { lang: 'ar-SA', rate: 0.9, fallbackLang: 'en-US' });
    } catch (e) { console.warn(e); }
  }
</script>

<div class="voice-settings">
  <h3>Voice settings</h3>
  {#if !supported}
    <p>Your browser does not support the Web Speech API.</p>
  {:else}
    <div style="margin-bottom:8px">
      <button on:click={refresh} disabled={loading}>Refresh voices</button>
      <button on:click={playSample} style="margin-left:8px">Play sample</button>
    </div>

    {#if loading}
      <div>Loading available voices…</div>
    {:else}
      {#if voices.length === 0}
        <div>No voices detected. Try refreshing or restarting your browser.</div>
      {:else}
        <div class="voice-list">
          <label>
            <input type="radio" bind:group={selected} value={null}>
            Auto (let the app pick the best voice)
          </label>
          {#each voices as v}
            <label>
              <input type="radio" bind:group={selected} value={v.name}>
              {v.name} — <small>{v.lang}{v.default ? ' • default' : ''}</small>
            </label>
          {/each}
        </div>
        <div style="margin-top:8px">
          <button on:click={save}>Save preference</button>
        </div>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .voice-settings{padding:12px;border:1px solid #eee;border-radius:8px;background:#fff}
  label{display:block;margin:6px 0}
</style>
