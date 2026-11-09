import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchSaveItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lemma!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  meaning!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  contextSentence!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  partOfSpeech?: string;
}

export class BatchSaveReaderDto {
  @IsString()
  @IsNotEmpty()
  articleId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchSaveItemDto)
  items!: BatchSaveItemDto[];
}

