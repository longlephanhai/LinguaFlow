import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveOccurrenceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  lemma: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  meaning: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  example?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  sentence: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  sourceUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  sourceTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  partOfSpeech?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  selectedText?: string;
}
