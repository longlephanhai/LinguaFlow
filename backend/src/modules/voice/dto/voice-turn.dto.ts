import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class VoiceTurnDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  userTranscript: string;

  @IsOptional()
  @IsString()
  userAudioBase64?: string;
}
