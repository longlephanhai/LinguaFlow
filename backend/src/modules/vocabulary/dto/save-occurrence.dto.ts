import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class MediaMetadataDto {
  @IsOptional()
  @IsIn(['youtube', 'netflix', 'web'])
  provider?: 'youtube' | 'netflix' | 'web';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  videoId?: string;

  @IsOptional()
  @IsNumber()
  timestampSeconds?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  audioSnippetUrl?: string;
}

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

  @IsOptional()
  @ValidateNested()
  @Type(() => MediaMetadataDto)
  mediaMetadata?: MediaMetadataDto;
}

