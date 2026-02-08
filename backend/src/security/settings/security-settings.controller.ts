import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { SecuritySettingsService, UpdateSecuritySettingsDto } from './security-settings.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Action } from '../../casl/action.enum';

@Controller('security/settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SecuritySettingsController {
  constructor(private readonly securitySettingsService: SecuritySettingsService) {}

  @Get()
  @Permissions({ action: Action.Read, subject: 'SecuritySettings' })
  get(@Request() req) {
    return this.securitySettingsService.get(req.user.negocioId);
  }

  @Patch()
  @Permissions({ action: Action.Update, subject: 'SecuritySettings' })
  update(@Body() dto: UpdateSecuritySettingsDto, @Request() req) {
    return this.securitySettingsService.update(req.user.negocioId, dto);
  }
}
