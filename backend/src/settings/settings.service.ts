import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSmtpConfigDto } from './dto/update-smtp-config.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async getSmtpConfig(negocioId: number) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { configuracion: true },
    });

    if (!negocio) {
      throw new NotFoundException('Business not found');
    }

    const config = negocio.configuracion as any;
    return config?.smtp || null;
  }

  async updateSmtpConfig(negocioId: number, dto: UpdateSmtpConfigDto) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
    });

    if (!negocio) {
      throw new NotFoundException('Business not found');
    }

    const currentConfig = (negocio.configuracion as any) || {};
    const updatedConfig = {
      ...currentConfig,
      smtp: dto,
    };

    const updated = await this.prisma.negocio.update({
      where: { id: negocioId },
      data: { configuracion: updatedConfig as any },
      select: { id: true, configuracion: true },
    });

    // Clear email service cache
    this.emailService.clearCache(negocioId);

    const updatedConfigData = updated.configuracion as any;
    return {
      success: true,
      message: 'SMTP configuration updated',
      data: updatedConfigData?.smtp || null,
    };
  }

  async testSmtpConnection(negocioId: number, dto: UpdateSmtpConfigDto) {
    // Temporarily save config for test
    await this.updateSmtpConfig(negocioId, dto);

    const isValid = await this.emailService.testConnection(negocioId);

    return {
      success: isValid,
      message: isValid ? 'Connection successful' : 'Connection failed',
    };
  }
}
