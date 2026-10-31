import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LookupVocabularyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  selectedText: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  contextText: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  sourceUrl?: string;
}
