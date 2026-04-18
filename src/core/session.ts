import type { Word } from './wordlist';
import type { CardState } from './srs';
import { isDueCardState } from './progress-summary';

export type SessionMode = 'ar2en' | 'en2ar';

export type SessionItem = {
  id: string;
  mode: SessionMode;
};

export type SavedSession = {
  queue: SessionItem[];
  index?: number;
  createdAt?: string;
};

export type SessionLimits = {
  newPerSession?: number;
  reviewPerSession?: number;
};

export type SessionPlan = {
  queue: SessionItem[];
  currentIndex: number;
  newCount: number;
  reviewCount: number;
};

const DEFAULT_NEW_PER_SESSION = 10;
const DEFAULT_REVIEW_PER_SESSION = 5;

export function localDateKey(date: Date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function isSameLocalDay(isoDate?: string, now: Date = new Date()): boolean {
  if (!isoDate) return false;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return localDateKey(parsed) === localDateKey(now);
}

export function pickSessionMode(random: () => number = Math.random): SessionMode {
  return random() < 0.5 ? 'ar2en' : 'en2ar';
}

export function normalizeSavedSession(
  input?: SavedSession | null,
  random: () => number = Math.random,
): SavedSession | null {
  if (!input || !Array.isArray(input.queue)) return null;

  const queue = input.queue
    .filter((item): item is SessionItem => Boolean(item && typeof item.id === 'string' && item.id.trim()))
    .map((item) => ({
      id: item.id.trim(),
      mode: item.mode === 'ar2en' || item.mode === 'en2ar' ? item.mode : pickSessionMode(random),
    }));

  if (queue.length === 0) return null;

  const index = typeof input.index === 'number' && Number.isFinite(input.index)
    ? Math.min(Math.max(Math.floor(input.index), 0), queue.length)
    : 0;

  const createdAt = typeof input.createdAt === 'string' && input.createdAt.trim() ? input.createdAt.trim() : undefined;

  return {
    queue,
    index,
    createdAt,
  };
}

function normalizeLimits(limits?: SessionLimits): Required<SessionLimits> {
  return {
    newPerSession: limits?.newPerSession ?? DEFAULT_NEW_PER_SESSION,
    reviewPerSession: limits?.reviewPerSession ?? DEFAULT_REVIEW_PER_SESSION,
  };
}

function toWordMap(words: Word[]): Map<string, Word> {
  return new Map(words.map((word) => [word.id, word] as const));
}

export function buildSessionPlan(
  words: Word[],
  states: Record<string, CardState>,
  savedSession?: SavedSession | null,
  options?: {
    limits?: SessionLimits;
    now?: Date | number;
    random?: () => number;
  },
): SessionPlan {
  const limits = normalizeLimits(options?.limits);
  const nowMs = typeof options?.now === 'number'
    ? options.now
    : options?.now?.getTime() ?? Date.now();
  const random = options?.random ?? Math.random;
  const wordMap = toWordMap(words);

  const normalizedSavedSession = normalizeSavedSession(savedSession, random);

  if (normalizedSavedSession && normalizedSavedSession.index != null) {
    const queue = normalizedSavedSession.queue
      .filter((item) => wordMap.has(item.id))
      .map((item) => ({
        id: item.id,
        mode: item.mode ?? pickSessionMode(random),
      }));

    const currentIndex = Math.min(Math.max(normalizedSavedSession.index ?? 0, 0), queue.length);
    const newCount = queue.filter((item) => (states[item.id]?.interval ?? 0) === 0).length;

    return {
      queue,
      currentIndex,
      newCount,
      reviewCount: queue.length - newCount,
    };
  }

  const dueAll = words
    .filter((word) => isDueCardState(states[word.id], nowMs))
    .sort((a, b) => new Date(states[a.id].dueDate).getTime() - new Date(states[b.id].dueDate).getTime());

  const newAll = words
    .filter((word) => (states[word.id]?.interval ?? 0) === 0);

  // Determine targets following the quota rules.
  // `reviewPerSession` contributes to the total 15-card cap, but when fewer than
  // 10 new words exist we fill the remaining session capacity with due reviews.
  const maxNew = limits.newPerSession;
  const reviewBuffer = limits.reviewPerSession;
  const totalCap = maxNew + reviewBuffer;

  let targetNew = Math.min(maxNew, newAll.length);
  let targetReview = 0;

  if (dueAll.length === 0) {
    // No reviews available: cap new words at newPerSession (typically 10).
    targetReview = 0;
    targetNew = Math.min(maxNew, newAll.length);
  } else {
    const remainingCapacity = Math.max(totalCap - targetNew, 0);
    targetReview = Math.min(dueAll.length, remainingCapacity);
  }

  const selectedReviews = dueAll.slice(0, targetReview);
  const selectedNew = newAll.slice(0, targetNew);

  // Build combined list and randomize final queue order while preserving quotas
  const combined = [...selectedReviews, ...selectedNew];

  // Fisher-Yates shuffle using provided random()
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = combined[i];
    combined[i] = combined[j];
    combined[j] = tmp;
  }

  const queue = combined.map((word) => ({ id: word.id, mode: pickSessionMode(random) }));

  return {
    queue,
    currentIndex: 0,
    newCount: selectedNew.length,
    reviewCount: selectedReviews.length,
  };
}
