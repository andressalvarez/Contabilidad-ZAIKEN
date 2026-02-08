import { Module } from '@nestjs/common';
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';
import { PermissionsController } from './permissions/permissions.controller';
import { PermissionsService } from './permissions/permissions.service';
import { SecuritySettingsController } from './settings/security-settings.controller';
import { SecuritySettingsService } from './settings/security-settings.service';
import { AuditController } from './audit/audit.controller';
import { AuditService } from './audit/audit.service';
import { SessionsController } from './sessions/sessions.controller';
import { SessionsService } from './sessions/sessions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [
    RolesController,
    PermissionsController,
    SecuritySettingsController,
    AuditController,
    SessionsController,
  ],
  providers: [
    RolesService,
    PermissionsService,
    SecuritySettingsService,
    AuditService,
    SessionsService,
  ],
  exports: [
    RolesService,
    PermissionsService,
    SecuritySettingsService,
    AuditService,
    SessionsService,
  ],
})
export class SecurityModule {}
