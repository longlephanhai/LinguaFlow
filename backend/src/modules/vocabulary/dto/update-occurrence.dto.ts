import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOccurrenceDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  sentence?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  meaning?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  example?: string;
}
