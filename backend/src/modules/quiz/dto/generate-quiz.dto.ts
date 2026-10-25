import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateQuizDto {
  @IsOptional()
  @IsIn(['all', 'recent'])
  scope?: 'all' | 'recent' = 'all';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number = 10;
}
