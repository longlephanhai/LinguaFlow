import { Injectable } from '@nestjs/common';

// TODO: Delegate chat to AiModule.chat()
// Mock AiModule in tests — never call real Gemini API in automated tests (PROJECT-RULES.md)
@Injectable()
export class ChatService {}
