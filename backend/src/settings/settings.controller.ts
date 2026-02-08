import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSmtpConfigDto } from './dto/update-smtp-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NegocioId } from '../auth/negocio-id.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Action } from '../casl/action.enum';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('smtp')
  @Permissions({ action: Action.Read, subject: 'Settings' })
  async getSmtpConfig(@NegocioId() negocioId: number) {
    const config = await this.settingsService.getSmtpConfig(negocioId);
    return {
      success: true,
      data: config,
    };
  }

  @Patch('smtp')
  @Permissions({ action: Action.Update, subject: 'Settings' })
  async updateSmtpConfig(
    @NegocioId() negocioId: number,
    @Body() dto: UpdateSmtpConfigDto,
  ) {
    return this.settingsService.updateSmtpConfig(negocioId, dto);
  }

  @Post('smtp/test')
  @Permissions({ action: Action.Update, subject: 'Settings' })
  async testSmtpConnection(
    @NegocioId() negocioId: number,
    @Body() dto: UpdateSmtpConfigDto,
  ) {
    return this.settingsService.testSmtpConnection(negocioId, dto);
  }
}
