import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerQuizDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  questionIndex: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  selectedIndex: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  timeSpentMs?: number;
}
