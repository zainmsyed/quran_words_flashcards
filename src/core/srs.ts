export type Rating = 'hard' | 'got' | 'easy';

export type CardState = {
  id: string;
  interval: number; // days
  ease: number;
  dueDate: string; // ISO
  reviewCount: number;
  hardCount: number;
  gotCount: number;
  easyCount: number;
  lastRating?: Rating;
  lastReviewedAt?: string;
};

export function initialCardState(id: string): CardState {
  return {
    id,
    interval: 0,
    ease: 2.5,
    dueDate: new Date().toISOString(),
    reviewCount: 0,
    hardCount: 0,
    gotCount: 0,
    easyCount: 0,
    lastRating: undefined,
    lastReviewedAt: undefined,
  };
}

export function normalizeCardState(state: Partial<CardState> & { id: string }): CardState {
  const base = initialCardState(state.id);
  return {
    ...base,
    ...state,
    reviewCount: state.reviewCount ?? base.reviewCount,
    hardCount: state.hardCount ?? base.hardCount,
    gotCount: state.gotCount ?? base.gotCount,
    easyCount: state.easyCount ?? base.easyCount,
    lastRating: state.lastRating,
    lastReviewedAt: state.lastReviewedAt,
  };
}

export function applyRatingToCard(state: CardState, rating: Rating): CardState {
  const normalized = normalizeCardState(state);
  let interval = normalized.interval;
  let ease = normalized.ease;
  const now = new Date();

  if (interval === 0) {
    // first interval for new cards
    if (rating === 'hard') interval = 0.25;
    else if (rating === 'got') interval = 1;
    else interval = 3;
  } else {
    if (rating === 'hard') {
      interval = Math.max(0.25, interval * 0.5);
      ease = Math.max(1.3, ease - 0.2);
    } else if (rating === 'got') {
      interval = Math.max(1, interval * 1.2);
    } else {
      interval = Math.max(3, interval * ease);
      ease = Math.min(3.5, ease + 0.1);
    }
  }

  const due = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    ...normalized,
    interval,
    ease,
    dueDate: due.toISOString(),
    reviewCount: normalized.reviewCount + 1,
    hardCount: normalized.hardCount + (rating === 'hard' ? 1 : 0),
    gotCount: normalized.gotCount + (rating === 'got' ? 1 : 0),
    easyCount: normalized.easyCount + (rating === 'easy' ? 1 : 0),
    lastRating: rating,
    lastReviewedAt: now.toISOString(),
  };
}
