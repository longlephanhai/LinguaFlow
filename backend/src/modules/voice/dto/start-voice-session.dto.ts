import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class StartVoiceSessionDto {
  @IsOptional()
  @IsString()
  scenarioPreset?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  targetWordsCount?: number;
}
