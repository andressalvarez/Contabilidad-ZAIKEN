import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdateSecuritySettingsDto {
  minPasswordLength?: number;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  passwordExpirationDays?: number;
  sessionTimeoutMinutes?: number;
  maxConcurrentSessions?: number;
  maxLoginAttempts?: number;
  lockoutDurationMinutes?: number;
  auditRetentionDays?: number;
  logAllActions?: boolean;
}

@Injectable()
export class SecuritySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(negocioId: number) {
    let settings = await this.prisma.securitySettings.findUnique({
      where: { negocioId },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await this.prisma.securitySettings.create({
        data: { negocioId },
      });
    }

    return settings;
  }

  async update(negocioId: number, dto: UpdateSecuritySettingsDto) {
    // Ensure settings exist
    await this.get(negocioId);

    return this.prisma.securitySettings.update({
      where: { negocioId },
      data: {
        minPasswordLength: dto.minPasswordLength,
        requireUppercase: dto.requireUppercase,
        requireNumbers: dto.requireNumbers,
        requireSpecialChars: dto.requireSpecialChars,
        passwordExpirationDays: dto.passwordExpirationDays,
        sessionTimeoutMinutes: dto.sessionTimeoutMinutes,
        maxConcurrentSessions: dto.maxConcurrentSessions,
        maxLoginAttempts: dto.maxLoginAttempts,
        lockoutDurationMinutes: dto.lockoutDurationMinutes,
        auditRetentionDays: dto.auditRetentionDays,
        logAllActions: dto.logAllActions,
      },
    });
  }

  // Validate password against security settings
  async validatePassword(negocioId: number, password: string): Promise<{ valid: boolean; errors: string[] }> {
    const settings = await this.get(negocioId);
    const errors: string[] = [];

    if (password.length < settings.minPasswordLength) {
      errors.push(`La contraseña debe tener al menos ${settings.minPasswordLength} caracteres`);
    }

    if (settings.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }

    if (settings.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }

    if (settings.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Check if user should be locked out
  async shouldLockUser(negocioId: number, failedAttempts: number): Promise<boolean> {
    const settings = await this.get(negocioId);
    return failedAttempts >= settings.maxLoginAttempts;
  }

  // Get lockout end time
  async getLockoutEndTime(negocioId: number): Promise<Date> {
    const settings = await this.get(negocioId);
    const now = new Date();
    return new Date(now.getTime() + settings.lockoutDurationMinutes * 60 * 1000);
  }

  // Check if session should expire
  async isSessionExpired(negocioId: number, lastActivity: Date): Promise<boolean> {
    const settings = await this.get(negocioId);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    return diffMinutes > settings.sessionTimeoutMinutes;
  }

  // Check if password needs to be changed
  async shouldChangePassword(negocioId: number, lastPasswordChange: Date | null): Promise<boolean> {
    const settings = await this.get(negocioId);

    if (settings.passwordExpirationDays === 0) {
      return false; // Password never expires
    }

    if (!lastPasswordChange) {
      return true; // No password change recorded
    }

    const now = new Date();
    const diffDays = (now.getTime() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > settings.passwordExpirationDays;
  }
}
