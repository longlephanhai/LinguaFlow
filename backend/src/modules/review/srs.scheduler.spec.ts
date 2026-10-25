import { describe, it, expect } from 'vitest';
import { scheduleNext } from './srs.scheduler.js';

describe('SM-2 Scheduler (scheduleNext)', () => {
  const fixedDate = new Date('2026-10-25T12:00:00.000Z');

  it('should reset repetitions to 0 and interval to 1 on forgotten review', () => {
    const result = scheduleNext({
      remembered: false,
      easeFactor: 2.5,
      repetitions: 4,
      intervalDays: 15,
      today: fixedDate,
    });

    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBe(2.3);
    expect(result.dueDate.toISOString()).toBe('2026-10-26T12:00:00.000Z');
  });

  it('should not let easeFactor drop below 1.3 on repeated failures', () => {
    const result = scheduleNext({
      remembered: false,
      easeFactor: 1.4,
      repetitions: 1,
      intervalDays: 2,
      today: fixedDate,
    });

    expect(result.easeFactor).toBe(1.3);
  });

  it('should set interval to 1 day on first successful recall (repetitions = 1)', () => {
    const result = scheduleNext({
      remembered: true,
      easeFactor: 2.5,
      repetitions: 0,
      intervalDays: 1,
      today: fixedDate,
    });

    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBe(2.6);
    expect(result.dueDate.toISOString()).toBe('2026-10-26T12:00:00.000Z');
  });

  it('should set interval to 6 days on second successful recall (repetitions = 2)', () => {
    const result = scheduleNext({
      remembered: true,
      easeFactor: 2.6,
      repetitions: 1,
      intervalDays: 1,
      today: fixedDate,
    });

    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(6);
    expect(result.easeFactor).toBe(2.7);
    expect(result.dueDate.toISOString()).toBe('2026-10-31T12:00:00.000Z');
  });

  it('should scale interval by easeFactor on third successful recall (repetitions >= 3)', () => {
    const result = scheduleNext({
      remembered: true,
      easeFactor: 2.5,
      repetitions: 2,
      intervalDays: 6,
      today: fixedDate,
    });

    expect(result.repetitions).toBe(3);
    // 6 * 2.5 = 15
    expect(result.intervalDays).toBe(15);
    expect(result.easeFactor).toBe(2.6);
    expect(result.dueDate.toISOString()).toBe('2026-11-09T12:00:00.000Z');
  });

  it('should calculate future repetitions correctly using previous interval and ease factor', () => {
    const result = scheduleNext({
      remembered: true,
      easeFactor: 2.6,
      repetitions: 3,
      intervalDays: 15,
      today: fixedDate,
    });

    expect(result.repetitions).toBe(4);
    // 15 * 2.6 = 39
    expect(result.intervalDays).toBe(39);
    expect(result.easeFactor).toBe(2.7);
  });
});
