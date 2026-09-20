// Review DTOs — SM-2 spaced repetition
// See ARCHITECTURE.md §9 for algorithm details

export interface ReviewCardDto {
  occurrenceId: string;
  word: string;
  sentence: string;
  sourceUrl: string;
  dueDate: string;
}

export interface ReviewResultDto {
  occurrenceId: string;
  remembered: boolean;
}

export interface ReviewSessionSummaryDto {
  reviewed: number;
  remembered: number;
  forgotten: number;
}
