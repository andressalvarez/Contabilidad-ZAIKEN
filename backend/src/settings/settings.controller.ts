import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSmtpConfigDto } from './dto/update-smtp-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { NegocioId } from '../auth/negocio-id.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('smtp')
  @Roles('ADMIN', 'ADMIN_NEGOCIO')
  async getSmtpConfig(@NegocioId() negocioId: number) {
    const config = await this.settingsService.getSmtpConfig(negocioId);
    return {
      success: true,
      data: config,
    };
  }

  @Patch('smtp')
  @Roles('ADMIN', 'ADMIN_NEGOCIO')
  async updateSmtpConfig(
    @NegocioId() negocioId: number,
    @Body() dto: UpdateSmtpConfigDto,
  ) {
    return this.settingsService.updateSmtpConfig(negocioId, dto);
  }

  @Post('smtp/test')
  @Roles('ADMIN', 'ADMIN_NEGOCIO')
  async testSmtpConnection(
    @NegocioId() negocioId: number,
    @Body() dto: UpdateSmtpConfigDto,
  ) {
    return this.settingsService.testSmtpConnection(negocioId, dto);
  }
}
