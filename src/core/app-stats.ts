export type AppStats = {
  studied: number;
  easy: number;
  streak: number;
  lastStudyDate?: string;
};

function toLocalDateKey(date: Date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function initialAppStats(): AppStats {
  return {
    studied: 0,
    easy: 0,
    streak: 0,
    lastStudyDate: undefined,
  };
}

export function normalizeAppStats(input?: Partial<AppStats> | null): AppStats {
  const base = initialAppStats();
  return {
    studied: input?.studied ?? base.studied,
    easy: input?.easy ?? base.easy,
    streak: input?.streak ?? base.streak,
    lastStudyDate: input?.lastStudyDate,
  };
}

export function recordStudy(stats: AppStats, rating: 'hard' | 'got' | 'easy', now: Date = new Date()): AppStats {
  const today = toLocalDateKey(now);
  const yesterday = toLocalDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  let streak = stats.streak;

  if (stats.lastStudyDate === today) {
    // already counted today's streak
  } else if (stats.lastStudyDate === yesterday) {
    streak = stats.streak + 1;
  } else {
    streak = 1;
  }

  return {
    studied: stats.studied + 1,
    easy: stats.easy + (rating === 'easy' ? 1 : 0),
    streak,
    lastStudyDate: today,
  };
}
