Bundled audio assets (POC)

This directory contains the generated pronunciation MP3s used for local QA and the current proof-of-concept.

Why these files are in the repo
- For the current QA/dev workflow the full 300-word POC audio set (public/audio/w1..w300.mp3) is included so reviewers can audition pronunciations quickly without running a generator or uploading assets to an external host.
- This is an intentional short-term choice to simplify manual QA. See the repository review for long-term options and the project's artifact policy.

Regenerating the audio (two supported paths)

1) Quick/dev POC (gTTS)
- Install gTTS: pip3 install gTTS
- Generate the full deck locally (idempotent — skips existing files):
  python3 scripts/generate_audio_gtts.py 300

2) Production-quality (Google Cloud Text-to-Speech)
- Install the Python client: pip3 install google-cloud-texttospeech
- Create or obtain a Google Cloud service account JSON key and set:
  export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
- Generate audio for the full deck (idempotent):
  python3 scripts/generate_audio_gcp.py --out public/audio

Manifest and coverage
- The generator can write a manifest that lists available files; to refresh the manifest without generating audio:
  python3 scripts/generate_audio_gcp.py --out public/audio --manifest-only

- To verify coverage (seed → present audio files):
  npm run check-audio-coverage

Notes and recommended workflow
- These files are committed to the feature/generate-voices branch as a short-term convenience for QA. The repository already includes generation scripts (gTTS prototype and a Google Cloud TTS generator) so these files can be regenerated as needed.
- Long-term options include publishing these assets as a release artifact, uploading them to object storage/CDN, or tracking them with Git LFS. If you plan to move the assets out of the repository, update the manifest and the runtime asset base path accordingly.

If you need help regenerating the audio, normalizing files (ffmpeg), or publishing the asset set to a release/CDN, I can prepare scripts to automate those steps.