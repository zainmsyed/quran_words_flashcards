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

function toNowMs(now: Date | number): number {
  return typeof now === 'number' ? now : now.getTime();
}

export function isMasteredCardState(state?: CardState | null): boolean {
  return (state?.easyCount ?? 0) >= MASTERED_EASY_COUNT;
}

export function isDueCardState(state: CardState | null | undefined, now: Date | number = new Date()): boolean {
  if (!state) return false;
  if (isMasteredCardState(state)) return false;

  const interval = state.interval ?? 0;
  if (interval <= 0) return false;

  const dueMs = new Date(state.dueDate).getTime();
  if (Number.isNaN(dueMs)) return false;

  return dueMs <= toNowMs(now);
}

export function summarizeStudyProgress(
  words: Word[],
  states: Record<string, CardState>,
  now: Date = new Date(),
): StudyProgressSummary {
  let seenWords = 0;
  let reviewCount = 0;
  let easyCount = 0;
  let masteredCount = 0;
  let dueCount = 0;

  for (const word of words) {
    const state = states[word.id];
    if (!state) continue;

    const reviewTotal = state.reviewCount ?? 0;
    const easyTotal = state.easyCount ?? 0;

    if (reviewTotal > 0) seenWords += 1;
    if (isMasteredCardState(state)) masteredCount += 1;
    if (isDueCardState(state, now)) dueCount += 1;

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
