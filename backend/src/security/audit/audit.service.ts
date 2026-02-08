import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum SecurityEventType {
  // Authentication events
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',

  // User management
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_ACTIVATE = 'USER_ACTIVATE',
  USER_DEACTIVATE = 'USER_DEACTIVATE',

  // Role management
  ROLE_CREATE = 'ROLE_CREATE',
  ROLE_UPDATE = 'ROLE_UPDATE',
  ROLE_DELETE = 'ROLE_DELETE',
  ROLE_ASSIGN = 'ROLE_ASSIGN',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',

  // Session management
  SESSION_CREATE = 'SESSION_CREATE',
  SESSION_EXPIRE = 'SESSION_EXPIRE',
  SESSION_REVOKE = 'SESSION_REVOKE',

  // Settings
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
}

export interface CreateAuditLogDto {
  negocioId: number;
  userId?: number;
  eventType: SecurityEventType | string;
  targetType?: string;
  targetId?: number;
  description: string;
  metadata?: object;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditActor {
  userId?: number;
  email?: string;
}

export interface AuditLogQuery {
  negocioId: number;
  userId?: number;
  eventType?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new audit log entry
   */
  async log(dto: CreateAuditLogDto) {
    return this.prisma.securityAuditLog.create({
      data: {
        negocioId: dto.negocioId,
        userId: dto.userId,
        eventType: dto.eventType,
        targetType: dto.targetType,
        targetId: dto.targetId,
        description: dto.description,
        metadata: dto.metadata ?? undefined,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });
  }

  async logSafe(dto: CreateAuditLogDto) {
    try {
      return await this.log(dto);
    } catch {
      return null;
    }
  }

  /**
   * Query audit logs with filters and pagination
   */
  async findAll(query: AuditLogQuery) {
    const {
      negocioId,
      userId,
      eventType,
      targetType,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = query;

    const where: any = { negocioId };

    if (userId) {
      where.userId = userId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.securityAuditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.securityAuditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit logs for a specific target (e.g., a user or role)
   */
  async findByTarget(negocioId: number, targetType: string, targetId: number) {
    return this.prisma.securityAuditLog.findMany({
      where: { negocioId, targetType, targetId },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get event types for filter dropdown
   */
  getEventTypes() {
    return Object.values(SecurityEventType);
  }

  /**
   * Get summary statistics for dashboard
   */
  async getSummary(negocioId: number, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalEvents, loginEvents, failedLogins, userChanges, roleChanges] =
      await Promise.all([
        this.prisma.securityAuditLog.count({
          where: { negocioId, createdAt: { gte: startDate } },
        }),
        this.prisma.securityAuditLog.count({
          where: {
            negocioId,
            eventType: SecurityEventType.LOGIN,
            createdAt: { gte: startDate },
          },
        }),
        this.prisma.securityAuditLog.count({
          where: {
            negocioId,
            eventType: SecurityEventType.LOGIN_FAILED,
            createdAt: { gte: startDate },
          },
        }),
        this.prisma.securityAuditLog.count({
          where: {
            negocioId,
            eventType: {
              in: [
                SecurityEventType.USER_CREATE,
                SecurityEventType.USER_UPDATE,
                SecurityEventType.USER_DELETE,
              ],
            },
            createdAt: { gte: startDate },
          },
        }),
        this.prisma.securityAuditLog.count({
          where: {
            negocioId,
            eventType: {
              in: [
                SecurityEventType.ROLE_CREATE,
                SecurityEventType.ROLE_UPDATE,
                SecurityEventType.ROLE_ASSIGN,
              ],
            },
            createdAt: { gte: startDate },
          },
        }),
      ]);

    return {
      totalEvents,
      loginEvents,
      failedLogins,
      userChanges,
      roleChanges,
      period: `${days} days`,
    };
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(negocioId: number, retentionDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.securityAuditLog.deleteMany({
      where: {
        negocioId,
        createdAt: { lt: cutoffDate },
      },
    });

    return { deleted: result.count };
  }
}
