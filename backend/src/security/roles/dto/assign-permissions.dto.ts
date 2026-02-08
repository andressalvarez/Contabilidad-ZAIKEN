import { IsArray, IsOptional, IsInt, IsObject } from 'class-validator';

export class AssignPermissionsDto {
  @IsArray()
  @IsInt({ each: true })
  permissionIds: number[];

  @IsOptional()
  @IsObject()
  conditions?: Record<number, object>;
}
