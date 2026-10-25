import { IsBoolean } from 'class-validator';

export class ReviewResultDto {
  @IsBoolean()
  remembered: boolean;
}
