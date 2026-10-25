export interface ReviewScheduleInput {
  remembered: boolean;
  easeFactor: number;
  repetitions: number;
  intervalDays: number;
  today?: Date;
}

export interface ReviewScheduleOutput {
  easeFactor: number;
  repetitions: number;
  intervalDays: number;
  dueDate: Date;
}

/**
 * Calculates next review parameters based on simplified SM-2 algorithm.
 * Reference: docs/ARCHITECTURE.md §9 and PRD.md FR-REVIEW-003.
 */
export function scheduleNext(input: ReviewScheduleInput): ReviewScheduleOutput {
  const { remembered, easeFactor = 2.5, repetitions = 0, intervalDays = 1 } = input;
  const baseDate = input.today ? new Date(input.today) : new Date();

  let nextRepetitions: number;
  let nextIntervalDays: number;
  let nextEaseFactor: number;

  if (!remembered) {
    nextRepetitions = 0;
    nextIntervalDays = 1;
    // Penalty for failure, capped at min 1.3
    nextEaseFactor = Math.max(1.3, Number((easeFactor - 0.2).toFixed(2)));
  } else {
    nextRepetitions = repetitions + 1;
    if (nextRepetitions === 1) {
      nextIntervalDays = 1;
    } else if (nextRepetitions === 2) {
      nextIntervalDays = 6;
    } else {
      nextIntervalDays = Math.round(intervalDays * easeFactor);
    }
    // Slight bonus for successful recall
    nextEaseFactor = Math.max(1.3, Number((easeFactor + 0.1).toFixed(2)));
  }

  const dueDate = new Date(baseDate.getTime() + nextIntervalDays * 24 * 60 * 60 * 1000);

  return {
    easeFactor: nextEaseFactor,
    repetitions: nextRepetitions,
    intervalDays: nextIntervalDays,
    dueDate,
  };
}
