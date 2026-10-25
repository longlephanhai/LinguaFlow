import { IsBoolean } from 'class-validator';

export class SuspendCardDto {
  @IsBoolean()
  suspended: boolean;
}
