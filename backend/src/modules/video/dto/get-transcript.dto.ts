import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GetTranscriptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  videoUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string;
}
