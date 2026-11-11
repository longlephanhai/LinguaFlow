import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class ReviewSyncItemDto {
  @IsMongoId()
  occurrenceId: string;

  @IsBoolean()
  remembered: boolean;

  @IsOptional()
  @IsDateString()
  reviewedAt?: string;
}

export class BatchReviewSyncDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ReviewSyncItemDto)
  items: ReviewSyncItemDto[];
}

