import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSmtpConfigDto } from './dto/update-smtp-config.dto';
import { EmailService } from '../email/email.service';
import {
  cloneDefaultNavigationLayout,
  CORE_NAVIGATION_CATALOG,
} from './navigation-defaults';
import {
  NavigationPlacementDto,
  NavigationSectionDto,
  NavigationWorldDto,
  UpdateNavigationLayoutDto,
} from './dto/update-navigation-layout.dto';

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

  getNavigationCatalog() {
    return CORE_NAVIGATION_CATALOG;
  }

  async getNavigationLayout(negocioId: number) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { configuracion: true },
    });

    if (!negocio) {
      throw new NotFoundException('Business not found');
    }

    const config = (negocio.configuracion as Record<string, unknown>) || {};
    const layout = this.normalizeNavigationLayout(config.navigation);

    return {
      success: true,
      data: layout,
    };
  }

  async updateNavigationLayout(
    negocioId: number,
    dto: UpdateNavigationLayoutDto,
    updatedBy?: number,
  ) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { configuracion: true },
    });

    if (!negocio) {
      throw new NotFoundException('Business not found');
    }

    const currentConfig = (negocio.configuracion as Record<string, unknown>) || {};
    const updatedLayout = this.normalizeNavigationLayout(dto, updatedBy);
    const updatedConfig = {
      ...currentConfig,
      navigation: updatedLayout,
    };

    const updated = await this.prisma.negocio.update({
      where: { id: negocioId },
      data: { configuracion: updatedConfig as any },
      select: { configuracion: true },
    });

    const updatedConfigData = (updated.configuracion as Record<string, unknown>) || {};

    return {
      success: true,
      message: 'Navigation layout updated',
      data: this.normalizeNavigationLayout(updatedConfigData.navigation, updatedBy),
    };
  }

  async resetNavigationLayout(negocioId: number, updatedBy?: number) {
    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { configuracion: true },
    });

    if (!negocio) {
      throw new NotFoundException('Business not found');
    }

    const currentConfig = (negocio.configuracion as Record<string, unknown>) || {};
    const resetLayout = this.normalizeNavigationLayout(cloneDefaultNavigationLayout(), updatedBy);
    const updatedConfig = {
      ...currentConfig,
      navigation: resetLayout,
    };

    await this.prisma.negocio.update({
      where: { id: negocioId },
      data: { configuracion: updatedConfig as any },
      select: { id: true },
    });

    return {
      success: true,
      message: 'Navigation layout restored',
      data: resetLayout,
    };
  }

  private normalizeNavigationLayout(
    input: unknown,
    updatedBy?: number,
  ): {
    version: number;
    worlds: NavigationWorldDto[];
    updatedAt: string;
    updatedBy: number | null;
  } {
    const fallback = cloneDefaultNavigationLayout();
    const raw = this.isObject(input) ? input : fallback;
    const worldsRaw = Array.isArray(raw.worlds) ? raw.worlds : fallback.worlds;

    const worlds = worldsRaw
      .filter((world): world is Record<string, unknown> => this.isObject(world))
      .map((world, worldIndex) => this.normalizeWorld(world, worldIndex));

    const normalizedWorlds =
      worlds.length > 0
        ? worlds
        : fallback.worlds.map((world, worldIndex) =>
            this.normalizeWorld(world as unknown as Record<string, unknown>, worldIndex),
          );

    return {
      version:
        typeof raw.version === 'number' && Number.isInteger(raw.version) && raw.version > 0
          ? raw.version
          : 1,
      worlds: normalizedWorlds,
      updatedAt: new Date().toISOString(),
      updatedBy: typeof updatedBy === 'number' ? updatedBy : null,
    };
  }

  private normalizeWorld(
    input: Record<string, unknown>,
    fallbackIndex: number,
  ): NavigationWorldDto {
    const sectionsRaw = Array.isArray(input.sections) ? input.sections : [];

    const sections = sectionsRaw
      .filter((section): section is Record<string, unknown> => this.isObject(section))
      .map((section, sectionIndex) => this.normalizeSection(section, sectionIndex));

    return {
      id: this.toStringOrFallback(input.id, `world_${fallbackIndex + 1}`),
      name: this.toStringOrFallback(input.name, `Dominio ${fallbackIndex + 1}`),
      order: this.toOrder(input.order, fallbackIndex + 1),
      enabled: typeof input.enabled === 'boolean' ? input.enabled : true,
      sections,
    };
  }

  private normalizeSection(
    input: Record<string, unknown>,
    fallbackIndex: number,
  ): NavigationSectionDto {
    const itemsRaw = Array.isArray(input.items) ? input.items : [];

    const items = itemsRaw
      .filter((item): item is Record<string, unknown> => this.isObject(item))
      .map((item, itemIndex) => this.normalizePlacement(item, itemIndex));

    return {
      id: this.toStringOrFallback(input.id, `section_${fallbackIndex + 1}`),
      title: this.toStringOrFallback(input.title, `Seccion ${fallbackIndex + 1}`),
      order: this.toOrder(input.order, fallbackIndex + 1),
      items,
    };
  }

  private normalizePlacement(
    input: Record<string, unknown>,
    fallbackIndex: number,
  ): NavigationPlacementDto {
    return {
      itemKey: this.toStringOrFallback(input.itemKey, `item_${fallbackIndex + 1}`),
      order: this.toOrder(input.order, fallbackIndex + 1),
      shortcut: typeof input.shortcut === 'boolean' ? input.shortcut : undefined,
    };
  }

  private toStringOrFallback(value: unknown, fallback: string): string {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  private toOrder(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.floor(value));
    }
    return Math.max(0, fallback);
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
