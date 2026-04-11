#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bootstrapPocketBaseSuperuser, ensurePocketBaseBinary, runPocketBaseMigrations } from './pocketbase-bootstrap.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const adminEmail = process.env.PB_ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.PB_ADMIN_PASSWORD ?? 'ChangeMe-12345';
const baseUrl = process.env.PB_BASE_URL ?? 'http://127.0.0.1:8099';

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function requestJson(url, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(url, {
    headers: {
      ...(isFormData ? {} : { 'content-type': 'application/json' }),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  let body = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { response, body };
}

async function authWithPassword(pathCandidates, identity, password) {
  let lastError = null;
  for (const pathCandidate of pathCandidates) {
    const { response, body } = await requestJson(`${baseUrl}${pathCandidate}`, {
      method: 'POST',
      body: JSON.stringify({ identity, password }),
    });

    if (response.ok) {
      return { response, body, path: pathCandidate };
    }

    if (response.status === 404) {
      lastError = new Error(`Auth route ${pathCandidate} was not found.`);
      continue;
    }

    lastError = new Error(`Auth attempt on ${pathCandidate} failed: ${JSON.stringify(body)}`);
    break;
  }

  throw lastError ?? new Error(`No auth route succeeded for ${identity}.`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // keep waiting
    }
    await wait(250);
  }
  throw new Error(`PocketBase did not become healthy at ${baseUrl}/api/health within ${timeoutMs}ms`);
}

async function main() {
  const pbBin = await ensurePocketBaseBinary({
    repoRoot,
    pbBin: process.env.PB_BIN,
    version: process.env.PB_VERSION,
  });

  const pbDataDir = await mkdtemp(path.join(tmpdir(), 'qfc-pb-smoke-'));
  const env = {
    ...process.env,
    PB_ADMIN_EMAIL: adminEmail,
    PB_ADMIN_PASSWORD: adminPassword,
  };

  await bootstrapPocketBaseSuperuser({
    repoRoot,
    pbBin,
    dataDir: pbDataDir,
    email: adminEmail,
    password: adminPassword,
  });

  await runPocketBaseMigrations({
    repoRoot,
    pbBin,
    dataDir: pbDataDir,
    env,
  });

  const proc = spawn(pbBin, ['serve', `--http=${baseUrl.replace('http://', '')}`, `--dir=${pbDataDir}`], {
    cwd: repoRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  proc.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
  });
  proc.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderr += text;
    process.stderr.write(chunk);
  });

  try {
    await waitForHealth();

    const adminLogin = await authWithPassword([
      '/api/collections/_superusers/auth-with-password',
      '/api/admins/auth-with-password',
    ], adminEmail, adminPassword);
    const adminToken = adminLogin.body?.token;
    assert.ok(adminToken, 'admin auth token missing');

    const collections = await requestJson(`${baseUrl}/api/collections`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(collections.response.ok, true, `collection list failed: ${JSON.stringify(collections.body)}`);
    const collectionNames = new Set((collections.body?.items ?? []).map((item) => item.name));
    assert.ok(collectionNames.has('users'), 'users auth collection missing');
    assert.ok(collectionNames.has('card_progress'), 'card_progress collection missing');
    assert.ok(collectionNames.has('study_state'), 'study_state collection missing');

    const invitedEmail = `invite-${Date.now()}@example.com`;
    const invitedPassword = 'Invited-12345';
    const invitedPayload = new FormData();
    invitedPayload.set('email', invitedEmail);
    invitedPayload.set('password', invitedPassword);
    invitedPayload.set('passwordConfirm', invitedPassword);
    invitedPayload.set('verified', 'true');

    const createUser = await requestJson(`${baseUrl}/api/collections/users/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: invitedPayload,
    });
    assert.equal(createUser.response.ok, true, `invited user creation failed: ${JSON.stringify(createUser.body)}`);
    const invitedUserId = createUser.body?.id;
    assert.ok(invitedUserId, 'invited user id missing');

    const invitedLogin = await requestJson(`${baseUrl}/api/collections/users/auth-with-password`, {
      method: 'POST',
      body: JSON.stringify({ identity: invitedEmail, password: invitedPassword }),
    });
    assert.equal(invitedLogin.response.ok, true, `invited user login failed: ${JSON.stringify(invitedLogin.body)}`);
    const invitedToken = invitedLogin.body?.token;
    const invitedAuthId = invitedLogin.body?.record?.id;
    assert.ok(invitedToken, 'invited auth token missing');
    assert.equal(invitedAuthId, invitedUserId, 'invited user id mismatch after auth');

    const recordPayload = new FormData();
    recordPayload.set('user', invitedUserId);
    recordPayload.set('word_id', 'w1');
    recordPayload.set('interval', '1');
    recordPayload.set('ease', '2.5');
    recordPayload.set('due_date', new Date().toISOString());
    recordPayload.set('review_count', '1');
    recordPayload.set('hard_count', '0');
    recordPayload.set('got_count', '1');
    recordPayload.set('easy_count', '0');
    recordPayload.set('last_rating', 'got');
    recordPayload.set('last_reviewed_at', new Date().toISOString());
    const createProgress = await requestJson(`${baseUrl}/api/collections/card_progress/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${invitedToken}` },
      body: recordPayload,
    });
    assert.equal(createProgress.response.ok, true, `card_progress create failed: ${JSON.stringify(createProgress.body)}`);
    const progressId = createProgress.body?.id;
    assert.ok(progressId, 'card_progress record id missing');

    const ownFetch = await requestJson(`${baseUrl}/api/collections/card_progress/records/${progressId}`, {
      headers: { Authorization: `Bearer ${invitedToken}` },
    });
    assert.equal(ownFetch.response.ok, true, `own record fetch failed: ${JSON.stringify(ownFetch.body)}`);
    assert.equal(ownFetch.body?.user, invitedUserId, 'fetched record does not belong to the signed-in user');

    const studyStatePayload = new FormData();
    const originalStudyState = {
      stats: { studied: 7, easy: 2, streak: 4, lastStudyDate: '2026-04-11' },
      session: {
        queue: [
          { id: 'w1', mode: 'ar2en' },
          { id: 'w2', mode: 'en2ar' },
        ],
        index: 1,
        createdAt: new Date().toISOString(),
      },
    };
    studyStatePayload.set('user', invitedUserId);
    studyStatePayload.set('state_json', JSON.stringify(originalStudyState));
    const createStudyState = await requestJson(`${baseUrl}/api/collections/study_state/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${invitedToken}` },
      body: studyStatePayload,
    });
    assert.equal(createStudyState.response.ok, true, `study_state create failed: ${JSON.stringify(createStudyState.body)}`);
    const studyStateId = createStudyState.body?.id;
    assert.ok(studyStateId, 'study_state record id missing');

    const ownStudyStateFetch = await requestJson(`${baseUrl}/api/collections/study_state/records/${studyStateId}`, {
      headers: { Authorization: `Bearer ${invitedToken}` },
    });
    assert.equal(ownStudyStateFetch.response.ok, true, `own study_state fetch failed: ${JSON.stringify(ownStudyStateFetch.body)}`);
    assert.deepEqual(JSON.parse(ownStudyStateFetch.body?.state_json), originalStudyState, 'study_state did not round-trip correctly');

    const changePasswordPayload = new FormData();
    const changedPassword = 'Invited-54321';
    changePasswordPayload.set('oldPassword', invitedPassword);
    changePasswordPayload.set('password', changedPassword);
    changePasswordPayload.set('passwordConfirm', changedPassword);
    const changePasswordResponse = await requestJson(`${baseUrl}/api/collections/users/records/${invitedUserId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${invitedToken}` },
      body: changePasswordPayload,
    });
    assert.equal(changePasswordResponse.response.ok, true, `change password failed: ${JSON.stringify(changePasswordResponse.body)}`);

    const changedLogin = await requestJson(`${baseUrl}/api/collections/users/auth-with-password`, {
      method: 'POST',
      body: JSON.stringify({ identity: invitedEmail, password: changedPassword }),
    });
    assert.equal(changedLogin.response.ok, true, `changed password login failed: ${JSON.stringify(changedLogin.body)}`);
    const changedToken = changedLogin.body?.token;
    assert.ok(changedToken, 'changed password auth token missing');

    const updatedStudyState = {
      ...originalStudyState,
      stats: { ...originalStudyState.stats, easy: 3 },
      session: { ...originalStudyState.session, index: 2 },
    };
    const updateStudyStatePayload = new FormData();
    updateStudyStatePayload.set('user', invitedUserId);
    updateStudyStatePayload.set('state_json', JSON.stringify(updatedStudyState));
    const updateStudyState = await requestJson(`${baseUrl}/api/collections/study_state/records/${studyStateId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${changedToken}` },
      body: updateStudyStatePayload,
    });
    assert.equal(updateStudyState.response.ok, true, `study_state update failed: ${JSON.stringify(updateStudyState.body)}`);

    const updatedStudyStateFetch = await requestJson(`${baseUrl}/api/collections/study_state/records/${studyStateId}`, {
      headers: { Authorization: `Bearer ${changedToken}` },
    });
    assert.equal(updatedStudyStateFetch.response.ok, true, `updated study_state fetch failed: ${JSON.stringify(updatedStudyStateFetch.body)}`);
    assert.deepEqual(JSON.parse(updatedStudyStateFetch.body?.state_json), updatedStudyState, 'updated study_state did not round-trip correctly');

    const secondEmail = `invite2-${Date.now()}@example.com`;
    const secondPassword = 'Invited-67890';
    const secondPayload = new FormData();
    secondPayload.set('email', secondEmail);
    secondPayload.set('password', secondPassword);
    secondPayload.set('passwordConfirm', secondPassword);
    secondPayload.set('verified', 'true');

    const secondUser = await requestJson(`${baseUrl}/api/collections/users/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: secondPayload,
    });
    assert.equal(secondUser.response.ok, true, `second user creation failed: ${JSON.stringify(secondUser.body)}`);

    const secondLogin = await requestJson(`${baseUrl}/api/collections/users/auth-with-password`, {
      method: 'POST',
      body: JSON.stringify({ identity: secondEmail, password: secondPassword }),
    });
    assert.equal(secondLogin.response.ok, true, `second user login failed: ${JSON.stringify(secondLogin.body)}`);
    const secondToken = secondLogin.body?.token;
    assert.ok(secondToken, 'second user auth token missing');

    const forbiddenFetch = await requestJson(`${baseUrl}/api/collections/card_progress/records/${progressId}`, {
      headers: { Authorization: `Bearer ${secondToken}` },
    });
    assert.equal(forbiddenFetch.response.ok, false, 'second user should not be able to read another user progress record');

    const forbiddenStudyStateFetch = await requestJson(`${baseUrl}/api/collections/study_state/records/${studyStateId}`, {
      headers: { Authorization: `Bearer ${secondToken}` },
    });
    assert.equal(forbiddenStudyStateFetch.response.ok, false, 'second user should not be able to read another user study_state record');

    const deleteStudyState = await requestJson(`${baseUrl}/api/collections/study_state/records/${studyStateId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${changedToken}` },
    });
    assert.equal(deleteStudyState.response.ok, true, `study_state delete failed: ${JSON.stringify(deleteStudyState.body)}`);

    console.log('PocketBase smoke test passed.');
  } finally {
    proc.kill('SIGTERM');
    await wait(1000);
    if (!proc.killed) {
      proc.kill('SIGKILL');
    }
    await rm(pbDataDir, { recursive: true, force: true });
    if (proc.exitCode === null) {
      await new Promise((resolve) => proc.once('exit', resolve));
    }
    if (proc.exitCode && proc.exitCode !== 0 && stderr) {
      process.stderr.write(`\nPocketBase exited with code ${proc.exitCode}\n`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
