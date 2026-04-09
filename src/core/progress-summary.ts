import type { Word } from './wordlist';
import type { CardState } from './srs';

export type StudyProgressSummary = {
  seenWords: number;
  reviewCount: number;
  easyCount: number;
  masteredCount: number;
  dueCount: number;
};

const MASTERED_INTERVAL = 3;

export function summarizeStudyProgress(
  words: Word[],
  states: Record<string, CardState>,
  now: Date = new Date(),
): StudyProgressSummary {
  const nowMs = now.getTime();
  let seenWords = 0;
  let reviewCount = 0;
  let easyCount = 0;
  let masteredCount = 0;
  let dueCount = 0;

  for (const word of words) {
    const state = states[word.id];
    if (!state) continue;

    const interval = state.interval ?? 0;
    const reviewTotal = state.reviewCount ?? 0;

    if (reviewTotal > 0) seenWords += 1;
    if (interval >= MASTERED_INTERVAL) masteredCount += 1;
    if (interval > 0 && new Date(state.dueDate).getTime() <= nowMs) dueCount += 1;

    reviewCount += reviewTotal;
    easyCount += state.easyCount ?? 0;
  }

  return {
    seenWords,
    reviewCount,
    easyCount,
    masteredCount,
    dueCount,
  };
}
