<script lang="ts">
  import { onMount } from 'svelte';
  import { getAvailableVoices, isSpeechSupported, speak } from '../core/tts-adapter';
  import { browserStorage } from '../core/storage-adapter';

  const STORAGE_VOICE_KEY = 'qfc2_tts_voice';

  type VoiceItem = { name: string; lang: string; default?: boolean };

  let voices: VoiceItem[] = [];
  let loading = true;
  let supported = false;
  let selected: string = '';
  let saveMessage = '';
  let saveTone: 'success' | 'error' = 'success';
  let loadError = '';

  async function refresh() {
    loading = true;
    loadError = '';
    try {
      voices = await getAvailableVoices();
    } catch (err) {
      console.warn('Failed to load voices', err);
      voices = [];
      loadError = 'Could not load browser voices. Please refresh the list or try another browser.';
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    supported = isSpeechSupported();
    await refresh();
    try { selected = (await browserStorage.getItem<string>(STORAGE_VOICE_KEY)) ?? ''; } catch (e) { selected = ''; }
  });

  async function save() {
    try {
      if (selected) {
        await browserStorage.setItem(STORAGE_VOICE_KEY, selected);
        saveMessage = 'Voice preference saved.';
      } else {
        await browserStorage.removeItem(STORAGE_VOICE_KEY);
        saveMessage = 'Voice preference cleared. Auto selection will be used.';
      }
      saveTone = 'success';
    } catch (e) {
      console.warn('Save voice failed', e);
      saveTone = 'error';
      saveMessage = 'Could not save voice preference. Please try again.';
    }
  }

  async function playSample() {
    if (!supported) return;
    try {
      if (selected) await speak('بِسْمِ اللَّهِ الرَّحْمَٰنِ', { voice: selected, lang: 'ar-SA', rate: 0.9, fallbackLang: 'en-US' });
      else await speak('بِسْمِ اللَّهِ الرَّحْمَٰنِ', { lang: 'ar-SA', rate: 0.9, fallbackLang: 'en-US' });
    } catch (e) {
      console.warn(e);
    }
  }
</script>

<section class="panel voice-settings">
  <div class="panel-heading">
    <div class="eyebrow">Audio / Voice</div>
    <h2>Pronunciation</h2>
    <p>Pick a browser voice or let the app choose automatically.</p>
  </div>

  {#if !supported}
    <p class="voice-note">Your browser does not support the Web Speech API.</p>
  {:else}
    <div class="voice-actions">
      <button class="action-btn" type="button" on:click={refresh} disabled={loading}>Refresh voices</button>
      <button class="action-btn primary" type="button" on:click={playSample}>Play sample</button>
      <button class="action-btn" type="button" on:click={save}>Save preference</button>
    </div>

    {#if saveMessage}
      <p class="save-feedback" data-tone={saveTone}>{saveMessage}</p>
    {/if}

    {#if loadError}
      <p class="voice-note error">{loadError}</p>
    {/if}

    {#if loading}
      <div class="voice-note">Loading available voices…</div>
    {:else}
      {#if voices.length === 0}
        <div class="voice-note">No voices detected. Try refreshing or restarting your browser.</div>
      {:else}
        <div class="voice-list">
          <label class="voice-item">
            <input type="radio" bind:group={selected} value="">
            <div>
              <strong>Auto</strong>
              <span>Let the app pick the best voice</span>
            </div>
          </label>
          {#each voices as v}
            <label class="voice-item">
              <input type="radio" bind:group={selected} value={v.name}>
              <div>
                <strong>{v.name}</strong>
                <span>{v.lang}{v.default ? ' • default' : ''}</span>
              </div>
            </label>
          {/each}
        </div>
      {/if}
    {/if}
  {/if}
</section>

<style>
  /* Reuse global panel tokens for Bauhaus alignment */
  .panel.voice-settings {
    /* panel padding already provided by .panel; override if needed */
    padding: 1.15rem;
  }

  .panel-heading {
    margin-bottom: 0.9rem;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--primary);
    margin-bottom: 0.35rem;
  }

  .panel-heading h2 {
    margin: 0 0 0.35rem 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(1.25rem, 3vw, 1.6rem);
    line-height: 1;
    color: var(--text);
  }

  .panel-heading p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .voice-note {
    padding: 0.85rem 1rem;
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    border: 0.5px solid var(--border);
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .voice-note.error {
    background: rgba(255, 240, 240, 0.95);
    border-color: rgba(208, 121, 121, 0.18);
    color: #a74e4e;
  }

  .voice-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .voice-actions .action-btn {
    min-height: 56px;
    width: 100%;
  }

  .save-feedback {
    margin: 0 0 1rem 0;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: 0.92rem;
    line-height: 1.4;
    font-weight: 700;
    background: var(--success-bg);
    color: var(--success-text);
  }

  .save-feedback[data-tone='error'] {
    background: rgba(255, 240, 240, 0.95);
    color: #b44848;
  }

  .voice-list {
    display: grid;
    gap: 0.65rem;
  }

  .voice-item {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.85rem 1rem;
    border-radius: var(--radius-md);
    border: 0.5px solid var(--border);
    background: var(--card);
    box-shadow: var(--shadow-primary);
    cursor: pointer;
  }

  .voice-item:hover {
    border-color: rgba(17, 17, 17, 0.06);
  }

  .voice-item input {
    margin: 0;
    accent-color: var(--primary);
    flex: 0 0 auto;
  }

  .voice-item strong {
    display: block;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1rem;
    color: var(--text);
    line-height: 1.2;
  }

  .voice-item span {
    display: block;
    color: var(--text-secondary);
    font-size: 0.92rem;
    line-height: 1.4;
    margin-top: 0.15rem;
  }

  @media (max-width: 720px) {
    .voice-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; }
  }
</style>
