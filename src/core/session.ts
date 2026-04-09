import type { Word } from './wordlist';
import type { CardState } from './srs';

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

export function retrySessionItem(item: SessionItem): SessionItem {
  return { id: item.id, mode: item.mode };
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

  if (savedSession && Array.isArray(savedSession.queue) && savedSession.index != null) {
    const queue = savedSession.queue
      .filter((item) => wordMap.has(item.id))
      .map((item) => ({
        id: item.id,
        mode: item.mode ?? pickSessionMode(random),
      }));

    const currentIndex = Math.min(Math.max(savedSession.index ?? 0, 0), queue.length);
    const newCount = queue.filter((item) => (states[item.id]?.interval ?? 0) === 0).length;

    return {
      queue,
      currentIndex,
      newCount,
      reviewCount: queue.length - newCount,
    };
  }

  const dueReviews = words
    .filter((word) => {
      const state = states[word.id];
      return Boolean(state && state.interval > 0 && new Date(state.dueDate).getTime() <= nowMs);
    })
    .sort((a, b) => new Date(states[a.id].dueDate).getTime() - new Date(states[b.id].dueDate).getTime())
    .slice(0, limits.reviewPerSession);

  const newCards = words
    .filter((word) => (states[word.id]?.interval ?? 0) === 0)
    .slice(0, limits.newPerSession);

  const queue = [...dueReviews, ...newCards].map((word) => ({
    id: word.id,
    mode: pickSessionMode(random),
  }));

  return {
    queue,
    currentIndex: 0,
    newCount: newCards.length,
    reviewCount: dueReviews.length,
  };
}
