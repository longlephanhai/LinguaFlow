export interface VocabularyLookupDto {
    selectedText: string;
    contextText: string;
    sourceUrl: string;
}
export interface VocabularyLookupResultDto {
    meaning: string;
    example: string;
    cached: boolean;
}
export interface SaveOccurrenceDto {
    selectedText: string;
    contextText: string;
    sourceUrl: string;
    meaning: string;
    example: string;
}
export interface OccurrenceDto {
    id: string;
    sentence: string;
    sourceUrl: string;
    savedAt: string;
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    dueDate: string;
}
export interface MeaningDto {
    id: string;
    definition: string;
    example: string;
    occurrences: OccurrenceDto[];
}
export interface VocabularyItemDto {
    id: string;
    word: string;
    meanings: MeaningDto[];
    createdAt: string;
}
//# sourceMappingURL=vocabulary.d.ts.map