import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class EvaluateShadowingDto {
  @IsString()
  @IsNotEmpty()
  targetText!: string;

  @IsOptional()
  @IsString()
  userTranscript?: string;

  @IsOptional()
  @IsString()
  userAudioBase64?: string;

  @IsOptional()
  @IsString()
  videoId?: string;

  @IsOptional()
  @IsNumber()
  segmentIndex?: number;
}

