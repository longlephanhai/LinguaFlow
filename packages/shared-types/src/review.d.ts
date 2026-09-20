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
//# sourceMappingURL=review.d.ts.map