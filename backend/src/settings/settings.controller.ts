import { Controller, Get, Patch, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSmtpConfigDto } from './dto/update-smtp-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NegocioId } from '../auth/negocio-id.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Action } from '../casl/action.enum';
import { UpdateNavigationLayoutDto } from './dto/update-navigation-layout.dto';

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

  @Get('navigation/catalog')
  @Permissions({ action: Action.Read, subject: 'Settings' })
  async getNavigationCatalog() {
    return {
      success: true,
      data: this.settingsService.getNavigationCatalog(),
    };
  }

  @Get('navigation/layout')
  async getNavigationLayout(@NegocioId() negocioId: number) {
    return this.settingsService.getNavigationLayout(negocioId);
  }

  @Patch('navigation/layout')
  @Permissions({ action: Action.Update, subject: 'Settings' })
  async updateNavigationLayout(
    @NegocioId() negocioId: number,
    @Body() dto: UpdateNavigationLayoutDto,
    @Req() req: any,
  ) {
    return this.settingsService.updateNavigationLayout(negocioId, dto, req?.user?.userId);
  }

  @Post('navigation/layout/reset')
  @Permissions({ action: Action.Update, subject: 'Settings' })
  async resetNavigationLayout(@NegocioId() negocioId: number, @Req() req: any) {
    return this.settingsService.resetNavigationLayout(negocioId, req?.user?.userId);
  }
}
