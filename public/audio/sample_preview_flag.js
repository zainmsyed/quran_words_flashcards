(function () {
  function detectPreviewMode() {
    if (typeof window.__QFC_PREVIEW_MODE__ === 'string' && window.__QFC_PREVIEW_MODE__.trim()) {
      return window.__QFC_PREVIEW_MODE__.trim();
    }

    const pathname = window.location && window.location.pathname ? String(window.location.pathname) : '';
    if (pathname.includes('mispronunciations_preview')) {
      return 'review';
    }

    return 'full';
  }

  const PREVIEW_MODE = detectPreviewMode();
  const REVIEW_MODE = PREVIEW_MODE === 'review';
  const DEFAULT_ISSUE = REVIEW_MODE ? 'still wrong after listening' : 'audio needs recreation';
  const DEFAULT_SUGGESTED_FIX = REVIEW_MODE ? 'regenerate gTTS and listen again' : 'recreate';
  const DEFAULT_REPORTER = 'you';
  const DEFAULT_SUCCESS_LABEL = REVIEW_MODE ? 'Still wrong ✓' : 'Flagged';
  const DEFAULT_BUTTON_LABEL = REVIEW_MODE ? 'Still wrong' : 'Flag';

  const FLAG_ENDPOINT = window.__QFC_FLAG_ENDPOINT__ || (window.location && window.location.port === '8001'
    ? '/flag'
    : 'http://localhost:8001/flag');

  function getWordData(btn) {
    const row = btn.closest('.word');
    if (!row) return { id: '', arabic: '', transliteration: '' };
    const id = row.dataset.wordId || row.querySelector('strong')?.textContent.trim() || '';
    const arabic = row.querySelector('.arabic')?.textContent.trim() || '';
    const transliteration = row.querySelector('.meta em')?.textContent.trim() || '';
    return { id, arabic, transliteration };
  }

  async function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // fall through
      }
    }

    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', 'true');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      return false;
    } finally {
      ta.remove();
    }
  }

  function makeCommand(payload) {
    const parts = [
      'node scripts/add_mispronunciation.mjs',
      '--id',
      JSON.stringify(payload.id),
    ];

    if (payload.stillWrong) {
      parts.push('--still-wrong');
    } else {
      parts.push('--issue', JSON.stringify(payload.issue));
    }

    if (payload.suggested) {
      parts.push('--suggested-fix', JSON.stringify(payload.suggested));
    }

    parts.push(
      '--reporter', JSON.stringify(payload.reporter || DEFAULT_REPORTER),
      '--date', JSON.stringify(payload.date),
    );

    return parts.join(' ');
  }

  async function submitFlag(payload, btn) {
    try {
      const res = await fetch(FLAG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        btn.textContent = DEFAULT_SUCCESS_LABEL;
        btn.disabled = true;
        btn.title = REVIEW_MODE
          ? 'Saved to mispronunciations list as still wrong'
          : 'Saved to mispronunciations list';
        alert(REVIEW_MODE
          ? 'Still-wrong flag saved — appended to .context/reviews/mispronunciations.md'
          : 'Flag saved — appended to .context/reviews/mispronunciations.md');
        return true;
      }

      const text = await res.text();
      throw new Error(text || res.statusText);
    } catch (err) {
      const cmd = makeCommand(payload);
      const copied = await copyText(cmd);
      if (copied) {
        alert(REVIEW_MODE
          ? 'Could not save via server. CLI command copied to clipboard so you can append a still-wrong row locally.'
          : 'Could not save via server. CLI command copied to clipboard. Paste it in the repo root and run it to append the entry.');
        return false;
      }
      prompt('Could not save via server. Copy this command and run it in the repo root:', cmd);
      return false;
    }
  }

  function bindButton(btn) {
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    const originalLabel = (btn.textContent || DEFAULT_BUTTON_LABEL).trim() || DEFAULT_BUTTON_LABEL;
    if (REVIEW_MODE && originalLabel.toLowerCase() === 'flag') {
      btn.textContent = DEFAULT_BUTTON_LABEL;
    }

    btn.addEventListener('click', async () => {
      const { id, arabic, transliteration } = getWordData(btn);
      if (!id) return;

      const payload = {
        id,
        issue: DEFAULT_ISSUE,
        suggested: DEFAULT_SUGGESTED_FIX,
        reporter: DEFAULT_REPORTER,
        date: new Date().toISOString().slice(0, 10),
        arabic,
        transliteration,
        stillWrong: REVIEW_MODE,
      };

      btn.disabled = true;
      btn.textContent = REVIEW_MODE ? 'Saving still wrong…' : 'Saving…';

      const saved = await submitFlag(payload, btn);
      if (!saved) {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });
  }

  function init() {
    document.querySelectorAll('.flag-btn').forEach(bindButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
