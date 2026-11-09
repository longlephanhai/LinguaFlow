import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentRecord, DocumentRecordDocument } from './schemas/document.schema.js';
import { ParseArticleDto } from './dto/parse-article.dto.js';
import { BatchSaveReaderDto } from './dto/batch-save-reader.dto.js';
import { QueryArticlesDto } from './dto/query-articles.dto.js';
import { AiService } from '../ai/ai.service.js';
import { VocabularyService } from '../vocabulary/vocabulary.service.js';

export function structureParagraphs(text: string) {
  const rawParagraphs = text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return rawParagraphs.map((para) => {
    const sentenceMatches = para.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [para];
    const sentences = sentenceMatches
      .map((s) => {
        const sentenceText = s.trim();
        const tokens = sentenceText.match(/\b[\w'-]+\b|[^\w\s]/g) || [sentenceText];
        return {
          text: sentenceText,
          tokens,
        };
      })
      .filter((s) => s.text.length > 0);

    return { sentences };
  });
}

@Injectable()
export class ReaderService {
  constructor(
    @InjectModel(DocumentRecord.name)
    private readonly documentModel: Model<DocumentRecordDocument>,
    private readonly aiService: AiService,
    private readonly vocabularyService: VocabularyService,
  ) {}

  async parseArticle(dto: ParseArticleDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const cleanText = dto.text.trim();
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    // 1. Generate or extract title
    let title = dto.title?.trim();
    if (!title) {
      const firstLine = cleanText.split('\n')[0].trim();
      title = firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
    }

    // 2. Discover in-context vocabulary via AiService
    const discovered = await this.aiService.extractVocabularyFromText(cleanText, 6);

    // 3. Persist document
    const doc = await this.documentModel.create({
      userId: userObjectId,
      title,
      content: cleanText,
      sourceUrl: dto.sourceUrl?.trim() || null,
      totalWordCount: wordCount,
      extractedLemmasCount: discovered.length,
      discoveredVocabulary: discovered.map((v) => ({
        lemma: v.lemma,
        partOfSpeech: v.partOfSpeech || 'noun',
        contextSentence: v.contextSentence,
        definition: v.definition,
        isSaved: false,
      })),
      isDeleted: false,
    });

    const paragraphs = structureParagraphs(cleanText);

    return {
      articleId: doc._id.toString(),
      title: doc.title,
      sourceUrl: doc.sourceUrl,
      totalWordCount: doc.totalWordCount,
      paragraphs,
      discoveredVocabulary: doc.discoveredVocabulary,
      createdAt: doc.createdAt,
    };
  }

  async getArticles(userId: string, dto: QueryArticlesDto) {
    const userObjectId = new Types.ObjectId(userId);
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    const filter = { userId: userObjectId, isDeleted: false };
    const [items, total] = await Promise.all([
      this.documentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id title sourceUrl totalWordCount extractedLemmasCount createdAt updatedAt')
        .lean(),
      this.documentModel.countDocuments(filter),
    ]);

    return {
      items: items.map((item) => ({
        id: item._id.toString(),
        title: item.title,
        sourceUrl: item.sourceUrl,
        totalWordCount: item.totalWordCount,
        extractedLemmasCount: item.extractedLemmasCount,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getArticleById(id: string, userId: string) {
    const doc = await this.documentModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!doc) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found or access denied.' },
      });
    }

    const paragraphs = structureParagraphs(doc.content);

    return {
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
      sourceUrl: doc.sourceUrl,
      totalWordCount: doc.totalWordCount,
      paragraphs,
      discoveredVocabulary: doc.discoveredVocabulary,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async deleteArticle(id: string, userId: string) {
    const doc = await this.documentModel.findOneAndUpdate(
      {
        _id: id,
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { returnDocument: 'after' },
    );

    if (!doc) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found or access denied.' },
      });
    }

    return { success: true };
  }

  async batchSaveVocabulary(dto: BatchSaveReaderDto, userId: string) {
    const doc = await this.documentModel.findOne({
      _id: dto.articleId,
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!doc) {
      throw new NotFoundException({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Article not found.' },
      });
    }

    const occurrences: Array<{ id: string; lemma: string }> = [];

    for (const item of dto.items) {
      const saved = await this.vocabularyService.saveOccurrence(
        {
          lemma: item.lemma,
          meaning: item.meaning,
          sentence: item.contextSentence,
          partOfSpeech: item.partOfSpeech,
          sourceTitle: doc.title,
          sourceUrl: doc.sourceUrl || '',
        },
        userId,
      );
      occurrences.push({ id: saved.occurrence._id.toString(), lemma: item.lemma });

      // Mark as isSaved in discoveredVocabulary if lemma matches
      const match = doc.discoveredVocabulary.find(
        (v) => v.lemma.toLowerCase() === item.lemma.trim().toLowerCase(),
      );
      if (match) {
        match.isSaved = true;
      }
    }

    await doc.save();

    return {
      savedCount: occurrences.length,
      occurrences,
    };
  }
}
