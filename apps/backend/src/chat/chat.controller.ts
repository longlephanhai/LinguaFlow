import { Controller } from '@nestjs/common';
import { ChatService } from './chat.service';

// TODO: Implement POST /chat/message
// All AI calls go through AiModule — never import Gemini SDK here (see PROJECT-RULES.md)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
}
