import { IsString, IsOptional, IsUrl, IsMongoId } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;

  @IsOptional()
  @IsMongoId({ message: 'roleId must be a valid MongoId' })
  roleId?: string;
}
