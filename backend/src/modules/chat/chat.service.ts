import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatSession } from './schemas/chat-session.schema.js';
import { AiService } from '../ai/ai.service.js';
import { VocabularyService } from '../vocabulary/vocabulary.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { ChatSessionsQueryDto } from './dto/chat-sessions-query.dto.js';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatSession.name)
    private readonly chatSessionModel: Model<ChatSession>,
    private readonly aiService: AiService,
    private readonly vocabularyService: VocabularyService,
  ) {}

  async sendMessage(userId: string, dto: SendMessageDto) {
    const trimmedMessage = dto.message.trim();
    if (!trimmedMessage) {
      throw new BadRequestException('Message cannot be empty');
    }

    const userObjId = new Types.ObjectId(userId);
    let session: ChatSession | null = null;

    if (dto.sessionId) {
      if (!Types.ObjectId.isValid(dto.sessionId)) {
        throw new NotFoundException('Chat session not found');
      }

      session = await this.chatSessionModel.findOne({
        _id: new Types.ObjectId(dto.sessionId),
        userId: userObjId,
        isDeleted: false,
      });

      if (!session) {
        throw new NotFoundException('Chat session not found');
      }
    } else {
      // Create new session
      const titleExcerpt =
        trimmedMessage.length > 50
          ? `${trimmedMessage.slice(0, 47)}...`
          : trimmedMessage;

      session = new this.chatSessionModel({
        userId: userObjId,
        title: titleExcerpt,
        messages: [],
      });
    }

    // Up to 200 messages cap per session
    if (session.messages.length >= 200) {
      throw new BadRequestException('Chat session has reached the 200 message limit. Please start a new session.');
    }

    // Fetch user's recent vocabulary to provide contextual encouragement
    let userVocabulary: string[] = [];
    try {
      userVocabulary = await this.vocabularyService.getRecentLemmas(userId, 10);
    } catch {
      userVocabulary = [];
    }

    // Prepare conversation history
    const history = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Invoke AiService (which passes through GeminiProvider with fallback models and error handling)
    const reply = await this.aiService.chat(history, trimmedMessage, userVocabulary);

    const now = new Date();
    session.messages.push(
      {
        role: 'user',
        content: trimmedMessage,
        createdAt: now,
      },
      {
        role: 'assistant',
        content: reply,
        createdAt: new Date(),
      },
    );

    if (!session.title) {
      session.title =
        trimmedMessage.length > 50
          ? `${trimmedMessage.slice(0, 47)}...`
          : trimmedMessage;
    }

    session.updatedAt = new Date();
    await session.save();

    return {
      sessionId: session._id.toString(),
      reply,
    };
  }

  async getSessions(userId: string, query: ChatSessionsQueryDto) {
    const userObjId = new Types.ObjectId(userId);
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const filter = {
      userId: userObjId,
      isDeleted: false,
    };

    const [total, sessions] = await Promise.all([
      this.chatSessionModel.countDocuments(filter),
      this.chatSessionModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id title messages createdAt updatedAt')
        .lean(),
    ]);

    const items = sessions.map((s) => ({
      id: s._id.toString(),
      title: s.title || 'Untitled conversation',
      messageCount: s.messages?.length || 0,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getSession(userId: string, sessionId: string) {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new NotFoundException('Chat session not found');
    }

    const session = await this.chatSessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    return {
      id: session._id.toString(),
      title: session.title || 'Untitled conversation',
      messages: session.messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  async deleteSession(userId: string, sessionId: string) {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new NotFoundException('Chat session not found');
    }

    const session = await this.chatSessionModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(sessionId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    return { success: true };
  }

  async getSuggestedWords(userId: string) {
    const lemmas = await this.vocabularyService.getRecentLemmas(userId, 20);
    if (!lemmas || lemmas.length === 0) {
      return { words: [] };
    }

    // Randomly select up to 5 unique words
    const shuffled = [...new Set(lemmas)].sort(() => 0.5 - Math.random());
    const words = shuffled.slice(0, 5);

    return { words };
  }
}
