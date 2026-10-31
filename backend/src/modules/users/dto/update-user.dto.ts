import { IsString, IsOptional, IsUrl, IsMongoId, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @ValidateIf((o) => typeof o.avatarUrl === 'string' && o.avatarUrl.trim().length > 0)
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;

  @IsOptional()
  @IsMongoId({ message: 'roleId must be a valid MongoId' })
  roleId?: string;
}
