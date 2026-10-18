import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsMongoId({ message: 'roleId must be a valid MongoId' })
  roleId: string;
}
