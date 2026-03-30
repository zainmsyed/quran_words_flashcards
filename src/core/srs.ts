export type CardState = {
  id: string;
  interval: number; // days
  ease: number;
  dueDate: string; // ISO
};

export function initialCardState(id: string): CardState {
  return {
    id,
    interval: 0,
    ease: 2.5,
    dueDate: new Date().toISOString(),
  };
}

export function applyRatingToCard(state: CardState, rating: 'hard' | 'got' | 'easy'): CardState {
  let interval = state.interval;
  let ease = state.ease;
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
  return { ...state, interval, ease, dueDate: due.toISOString() };
}
