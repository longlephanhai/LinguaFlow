import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  dailyReviewGoal?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  quizDefaultCount?: number;

  @IsOptional()
  @IsString()
  timezone?: string;
}
