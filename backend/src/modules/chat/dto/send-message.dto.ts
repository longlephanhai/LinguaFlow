import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(3000)
  message: string;
}
