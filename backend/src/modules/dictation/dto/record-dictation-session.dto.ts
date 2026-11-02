import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class RecordDictationSessionDto {
  @IsString()
  @IsNotEmpty()
  videoId!: string;

  @IsNumber()
  @Min(0)
  completedSegments!: number;

  @IsNumber()
  @Min(1)
  totalSegments!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  accuracyScore!: number;

  @IsNumber()
  @Min(0)
  timeSpentSeconds!: number;

  @IsNumber()
  @Min(0)
  mistakesCount!: number;
}

