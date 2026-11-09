import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';

export class ParseArticleDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Text must be at least 20 characters long.' })
  @MaxLength(100000, { message: 'Text cannot exceed 100,000 characters.' })
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sourceUrl?: string;
}
