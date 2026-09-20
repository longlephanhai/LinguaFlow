// Vocabulary DTOs — placeholder interfaces
// Follows the 3-layer model: vocabularyItem → meaning → occurrence
// See docs/DATA-SCHEMA.md for full schema. NEVER flatten this structure.

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
  // SM-2 fields (see ARCHITECTURE.md §9)
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
