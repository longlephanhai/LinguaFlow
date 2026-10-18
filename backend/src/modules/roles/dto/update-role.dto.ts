import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Each permission must be a valid MongoId' })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
