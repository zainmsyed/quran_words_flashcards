import { browserStorage } from './storage-adapter';
import { initialAppStats, normalizeAppStats, type AppStats } from './app-stats';
import { initialCardState, normalizeCardState, type CardState, type Rating } from './srs';
import { summarizeStudyProgress } from './progress-summary';
import { normalizeSavedSession, type SavedSession } from './session';
import type { AuthSession } from './pocketbase-auth';
import { PocketBaseAuthError, resolvePocketBaseBaseUrl } from './pocketbase-auth';
import type { Word } from './wordlist';

const CARD_PROGRESS_COLLECTION = 'card_progress';
const STUDY_STATE_COLLECTION = 'study_state';
const STUDY_STATE_JSON_FIELD = 'state_json';

const LEGACY_STUDY_KEYS = ['qfc2_states', 'qfc2_stats', 'qfc2_session'] as const;

export type StoredStudyState = {
  stats: AppStats;
  session: SavedSession | null;
  progressFingerprint: string;
};

export type PocketBaseStudySnapshot = {
  states: Record<string, CardState>;
  appStats: AppStats;
  session: SavedSession | null;
};

type PocketBaseListResponse<T> = {
  items?: T[];
  page?: number;
  perPage?: number;
  totalItems?: number;
  totalPages?: number;
};

type PocketBaseCardProgressRecord = {
  id?: string;
  user?: string;
  word_id?: string;
  interval?: number;
  ease?: number;
  due_date?: string;
  review_count?: number;
  hard_count?: number;
  got_count?: number;
  easy_count?: number;
  last_rating?: Rating;
  last_reviewed_at?: string;
};

type PocketBaseStudyStateRecord = {
  id?: string;
  user?: string;
  [STUDY_STATE_JSON_FIELD]?: string;
};

function trimValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidRating(value: unknown): value is Rating {
  return value === 'hard' || value === 'got' || value === 'easy';
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function hashString(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function normalizeDateValue(value: unknown, fallback = ''): string {
  const trimmed = trimValue(value);
  if (!trimmed) return fallback;

  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return fallback || trimmed;
  }

  return parsed.toISOString();
}

export function createCardProgressFingerprint(states: Record<string, CardState>): string {
  const canonical = Object.values(states)
    .map((state) => normalizeCardState({ id: state.id, ...state }))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((state) => {
      const isUntouched = state.interval <= 0
        && state.reviewCount <= 0
        && state.hardCount <= 0
        && state.gotCount <= 0
        && state.easyCount <= 0
        && !state.lastRating
        && !state.lastReviewedAt;

      return {
        id: state.id,
        interval: state.interval,
        ease: state.ease,
        dueDate: isUntouched ? '' : normalizeDateValue(state.dueDate),
        reviewCount: state.reviewCount,
        hardCount: state.hardCount,
        gotCount: state.gotCount,
        easyCount: state.easyCount,
        lastRating: state.lastRating ?? '',
        lastReviewedAt: isUntouched ? '' : normalizeDateValue(state.lastReviewedAt),
      };
    });

  return hashString(JSON.stringify(canonical));
}

function normalizeFingerprint(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function encodeStoredStudyState(state: StoredStudyState): string {
  return JSON.stringify({
    stats: normalizeAppStats(state.stats),
    session: normalizeSavedSession(state.session) ?? null,
    progressFingerprint: normalizeFingerprint(state.progressFingerprint),
  });
}

export function decodeStoredStudyState(raw: unknown): StoredStudyState | null {
  if (!raw) return null;

  let payload: any = raw;
  if (typeof raw === 'string') {
    try {
      payload = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!payload || typeof payload !== 'object') return null;

  const stats = normalizeAppStats(payload.stats);
  const session = normalizeSavedSession(payload.session ?? null);
  const progressFingerprint = normalizeFingerprint(payload.progressFingerprint);
  return { stats, session, progressFingerprint };
}

function isRecordLike(input: unknown): input is Record<string, unknown> {
  return Boolean(input && typeof input === 'object');
}

function isMissingCollectionContextError(error: unknown): boolean {
  return error instanceof PocketBaseAuthError && error.message.toLowerCase().includes('missing collection context');
}

function toStudyStateRecordPayload(state: StoredStudyState): Record<string, unknown> {
  return {
    [STUDY_STATE_JSON_FIELD]: encodeStoredStudyState(state),
  };
}

function fromCardProgressRecord(record: PocketBaseCardProgressRecord): CardState | null {
  const wordId = trimValue(record.word_id);
  if (!wordId) return null;

  return normalizeCardState({
    id: wordId,
    interval: toNumber(record.interval, 0),
    ease: toNumber(record.ease, 2.5),
    dueDate: normalizeDateValue(record.due_date, new Date().toISOString()),
    reviewCount: toNumber(record.review_count, 0),
    hardCount: toNumber(record.hard_count, 0),
    gotCount: toNumber(record.got_count, 0),
    easyCount: toNumber(record.easy_count, 0),
    lastRating: isValidRating(record.last_rating) ? record.last_rating : undefined,
    lastReviewedAt: normalizeDateValue(record.last_reviewed_at) || undefined,
  });
}

function toCardProgressPayload(state: CardState, userId: string): Record<string, unknown> {
  return {
    user: userId,
    word_id: state.id,
    interval: state.interval,
    ease: state.ease,
    due_date: state.dueDate,
    review_count: state.reviewCount,
    hard_count: state.hardCount,
    got_count: state.gotCount,
    easy_count: state.easyCount,
    last_rating: state.lastRating ?? null,
    last_reviewed_at: state.lastReviewedAt ?? null,
  };
}

async function pocketBaseRequest<T>(session: AuthSession, path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = resolvePocketBaseBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        authorization: `Bearer ${session.token}`,
        'content-type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new PocketBaseAuthError('unavailable', 'PocketBase could not be reached.');
  }

  let payload: any = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const message = typeof payload?.message === 'string'
      ? payload.message
      : typeof payload?.data?.message === 'string'
        ? payload.data.message
        : 'PocketBase request failed.';

    if (response.status === 401 || response.status === 403) {
      throw new PocketBaseAuthError('unauthorized', message || 'Your session is no longer valid.');
    }

    throw new PocketBaseAuthError('unavailable', message || 'PocketBase is currently unavailable.');
  }

  return payload as T;
}

async function listPocketBaseRecords<T>(session: AuthSession, collection: string, filter: string): Promise<T[]> {
  const perPage = 200;
  let page = 1;
  const all: T[] = [];

  while (true) {
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      filter,
    });

    let response: PocketBaseListResponse<T>;
    try {
      response = await pocketBaseRequest<PocketBaseListResponse<T>>(session, `/api/collections/${collection}/records?${params.toString()}`);
    } catch (error) {
      if (isMissingCollectionContextError(error)) return [];
      throw error;
    }

    const items = Array.isArray(response.items) ? response.items : [];
    all.push(...items);

    const totalPages = typeof response.totalPages === 'number' && response.totalPages > 0 ? response.totalPages : undefined;
    if (items.length < perPage) break;
    if (totalPages != null && page >= totalPages) break;
    page += 1;
  }

  return all;
}

async function getFirstPocketBaseRecord<T>(session: AuthSession, collection: string, filter: string): Promise<T | null> {
  const params = new URLSearchParams({
    page: '1',
    perPage: '1',
    filter,
  });

  try {
    const response = await pocketBaseRequest<PocketBaseListResponse<T>>(session, `/api/collections/${collection}/records?${params.toString()}`);
    const items = Array.isArray(response.items) ? response.items : [];
    return items[0] ?? null;
  } catch (error) {
    if (isMissingCollectionContextError(error)) return null;
    throw error;
  }
}

async function createPocketBaseRecord<T>(session: AuthSession, collection: string, payload: Record<string, unknown>): Promise<T> {
  try {
    return await pocketBaseRequest<T>(session, `/api/collections/${collection}/records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (isMissingCollectionContextError(error)) {
      throw new PocketBaseAuthError('unavailable', `PocketBase collection "${collection}" is missing. Run the PocketBase migrations and reload.`);
    }
    throw error;
  }
}

async function updatePocketBaseRecord<T>(session: AuthSession, collection: string, recordId: string, payload: Record<string, unknown>): Promise<T> {
  try {
    return await pocketBaseRequest<T>(session, `/api/collections/${collection}/records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (isMissingCollectionContextError(error)) {
      throw new PocketBaseAuthError('unavailable', `PocketBase collection "${collection}" is missing. Run the PocketBase migrations and reload.`);
    }
    throw error;
  }
}

async function upsertPocketBaseRecord<T extends { id?: string }>(
  session: AuthSession,
  collection: string,
  filter: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const existing = await getFirstPocketBaseRecord<T>(session, collection, filter);
  if (existing?.id) {
    return updatePocketBaseRecord<T>(session, collection, existing.id, payload);
  }

  return createPocketBaseRecord<T>(session, collection, payload);
}

function normalizeStudyStateRecord(record: PocketBaseStudyStateRecord | null): StoredStudyState | null {
  if (!record || !isRecordLike(record)) return null;
  const rawState = record[STUDY_STATE_JSON_FIELD];
  return decodeStoredStudyState(rawState);
}

export function createStoredStudyState(
  stats: AppStats,
  session: SavedSession | null,
  progressFingerprint: string,
): StoredStudyState {
  return {
    stats: normalizeAppStats(stats),
    session: normalizeSavedSession(session),
    progressFingerprint: normalizeFingerprint(progressFingerprint),
  };
}

export async function clearLegacyStudyStorage(): Promise<void> {
  await Promise.all(LEGACY_STUDY_KEYS.map(key => browserStorage.removeItem(key)));
}

export async function loadAuthenticatedStudySnapshot(session: AuthSession, words: Word[]): Promise<PocketBaseStudySnapshot> {
  const [progressRecords, studyStateRecord] = await Promise.all([
    listPocketBaseRecords<PocketBaseCardProgressRecord>(session, CARD_PROGRESS_COLLECTION, `user="${session.user.id}"`),
    getFirstPocketBaseRecord<PocketBaseStudyStateRecord>(session, STUDY_STATE_COLLECTION, `user="${session.user.id}"`),
  ]);

  const states: Record<string, CardState> = {};
  for (const word of words) {
    states[word.id] = initialCardState(word.id);
  }

  for (const record of progressRecords) {
    const state = fromCardProgressRecord(record);
    if (!state) continue;
    states[state.id] = state;
  }

  const progressFingerprint = createCardProgressFingerprint(states);
  const storedState = normalizeStudyStateRecord(studyStateRecord);
  const summary = summarizeStudyProgress(words, states, new Date());
  const appStats = normalizeAppStats({
    ...(storedState?.stats ?? initialAppStats()),
    studied: summary.seenWords,
    easy: summary.easyCount,
  });
  const hasStoredState = storedState != null;
  const canUseLegacySession = hasStoredState && !storedState.progressFingerprint;
  const canUseNoProgressSession = hasStoredState && progressRecords.length === 0;
  const sessionFingerprintMatches = hasStoredState && storedState.progressFingerprint === progressFingerprint;
  const sessionState = (sessionFingerprintMatches || canUseLegacySession || canUseNoProgressSession)
    ? normalizeSavedSession(storedState?.session)
    : null;

  return {
    states,
    appStats,
    session: sessionState,
  };
}

export async function savePocketBaseCardState(session: AuthSession, state: CardState): Promise<void> {
  const payload = toCardProgressPayload(normalizeCardState(state), session.user.id);
  await upsertPocketBaseRecord(session, CARD_PROGRESS_COLLECTION, `user="${session.user.id}" && word_id="${state.id}"`, payload);
}

export async function savePocketBaseStudyState(
  session: AuthSession,
  stats: AppStats,
  savedSession: SavedSession | null,
  states: Record<string, CardState>,
): Promise<void> {
  const payload = {
    user: session.user.id,
    ...toStudyStateRecordPayload(createStoredStudyState(stats, savedSession, createCardProgressFingerprint(states))),
  };

  await upsertPocketBaseRecord(session, STUDY_STATE_COLLECTION, `user="${session.user.id}"`, payload);
}

export function summarizeStatesForUser(words: Word[], states: Record<string, CardState>): AppStats {
  const summary = summarizeStudyProgress(words, states, new Date());
  return normalizeAppStats({
    ...initialAppStats(),
    studied: summary.seenWords,
    easy: summary.easyCount,
  });
}
