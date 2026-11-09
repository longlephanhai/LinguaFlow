import { IsString, IsNotEmpty } from 'class-validator';

export class EndVoiceSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
