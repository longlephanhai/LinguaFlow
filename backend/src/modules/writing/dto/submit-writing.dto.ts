import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class SubmitWritingDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Text must be at least 20 characters long' })
  @MaxLength(5000, { message: 'Text cannot exceed 5000 characters' })
  text: string;
}
