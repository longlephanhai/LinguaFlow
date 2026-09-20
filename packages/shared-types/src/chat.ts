// Chat DTOs — AI conversation practice via AiModule

export interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SendChatMessageDto {
  message: string;
  history: ChatMessageDto[];
}

export interface ChatResponseDto {
  reply: string;
  timestamp: string;
}
