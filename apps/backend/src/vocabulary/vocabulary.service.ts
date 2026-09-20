import { Injectable } from '@nestjs/common';

// TODO: Implement lookup (check cache first), save occurrence
// Always write through the full chain: vocabularyItem → meaning → occurrence
// See DATA-SCHEMA.md — NEVER flatten the 3-layer structure (PROJECT-RULES.md)
@Injectable()
export class VocabularyService {}
