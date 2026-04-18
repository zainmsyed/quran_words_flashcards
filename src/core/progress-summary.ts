import type { Word } from './wordlist';
import type { CardState } from './srs';

export type StudyProgressSummary = {
  seenWords: number;
  reviewCount: number;
  easyCount: number;
  masteredCount: number;
  dueCount: number;
};

export const MASTERED_EASY_COUNT = 3;

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
    const easyTotal = state.easyCount ?? 0;

    if (reviewTotal > 0) seenWords += 1;
    // A word is considered mastered when it has been marked 'easy' at least
    // MASTERED_EASY_COUNT times (explicit user mastery rather than interval).
    if (easyTotal >= MASTERED_EASY_COUNT) masteredCount += 1;
    if (interval > 0 && new Date(state.dueDate).getTime() <= nowMs) dueCount += 1;

    reviewCount += reviewTotal;
    easyCount += easyTotal;
  }

  return {
    seenWords,
    reviewCount,
    easyCount,
    masteredCount,
    dueCount,
  };
}
