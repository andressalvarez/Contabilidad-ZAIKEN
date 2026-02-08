import { PartialType } from '@nestjs/mapped-types';
import { CreateSecurityRoleDto } from './create-security-role.dto';

export class UpdateSecurityRoleDto extends PartialType(CreateSecurityRoleDto) {}
