Google Cloud TTS generation — usage and setup

This document explains how to generate the bundled MP3 pronunciation assets using Google Cloud Text-to-Speech.

Prerequisites
- Python 3.8+ and pip
- A Google Cloud project with the Text-to-Speech API enabled
- A service-account JSON key with access to Text-to-Speech (do NOT commit this key)

Step-by-step: enable API and create credentials
1. Install the gcloud CLI and authenticate:
   - https://cloud.google.com/sdk/docs/install
   - gcloud auth login

2. Select or create a project:
   gcloud projects create PROJECT_ID --set-as-default
   or
   gcloud config set project PROJECT_ID

3. Enable the Text-to-Speech API:
   gcloud services enable texttospeech.googleapis.com --project=PROJECT_ID

4. Create a service account for audio generation:
   gcloud iam service-accounts create audio-generator --display-name="Audio generator"

5. Grant permissions to the service account. Recommended (least-privilege) role:
   - roles/texttospeech.admin (or, if not available, roles/editor)

   Example:
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:audio-generator@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/texttospeech.admin"

6. Create and download a JSON key for the service account:
   gcloud iam service-accounts keys create key.json \
     --iam-account=audio-generator@${PROJECT_ID}.iam.gserviceaccount.com

7. Keep key.json safe and do NOT commit it to version control.

Local usage
1. Install the Python dependency:
   pip install --user google-cloud-texttospeech

2. Export the credential environment variable:
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"

3. Run a small sample (first 10 words) to audition the voice:
   python3 scripts/generate_audio_gcp.py --out public/audio --sample 10 --voice "ar-XA-Neural-B"

4. Inspect public/audio/sample_preview.html (the repository includes a simple preview page) or run the dev server and open:
   http://localhost:5185/audio/sample_preview.html

5. If satisfied, generate the full deck (may incur a small charge):
   python3 scripts/generate_audio_gcp.py --out public/audio

CI usage notes
- Store the service-account key in a secure CI secret and write it to a file during the run. Example (pseudo-steps):
  - echo "$GC_KEY_JSON" > /tmp/key.json
  - export GOOGLE_APPLICATION_CREDENTIALS=/tmp/key.json
  - python3 scripts/generate_audio_gcp.py --out public/audio

- Avoid committing the key to the repo. Commit only the generated public/audio files as a single separate commit.

Manifest and runtime
- The generator script writes public/audio/manifest.json describing generated files (id, filename, bytes). The runtime adapter can use this manifest to determine coverage and avoid hard-coded bundled id lists.

Cost and billing
- Google Cloud Text-to-Speech is billed by usage (characters or audio seconds). Generating 300 single-word utterances is typically a small, one-time bill.
- Check current pricing before running large batches.

Troubleshooting
- If you see authentication errors, confirm GOOGLE_APPLICATION_CREDENTIALS points to a valid service account key and that the service account has a role with Text-to-Speech permission.
- If the google-cloud-texttospeech client is missing, install it via pip.

Alternative quick preview (no GCP account)
- The repo contains a prototype generator (scripts/generate_audio_gtts.py) that uses gTTS to produce quick samples without credentials. These samples are useful for auditioning pacing and rough pronunciation but are NOT a replacement for the higher-quality neural voices available from cloud providers.
