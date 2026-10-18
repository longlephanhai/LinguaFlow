import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Each permission must be a valid MongoId' })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
