import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import { AuditService, SecurityEventType } from '../audit/audit.service';
import { RequestContext } from '../../common/utils/request-context.util';

interface SessionAudit {
  actorUserId?: number;
  actorEmail?: string;
  context?: RequestContext;
}

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new session for a user
   */
  async createSession(
    userId: number,
    negocioId: number,
    token: string,
    expiresAt: Date,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    // Hash the token for storage
    const tokenHash = this.hashToken(token);

    return this.prisma.securitySession.create({
      data: {
        userId,
        negocioId,
        tokenHash,
        deviceInfo,
        ipAddress,
        expiresAt,
        isActive: true,
      },
    });
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: number, negocioId: number) {
    return this.prisma.securitySession.findMany({
      where: {
        userId,
        negocioId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        lastActivity: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { lastActivity: 'desc' },
    });
  }

  /**
   * Get all active sessions for a business (admin view)
   */
  async getAllActiveSessions(negocioId: number) {
    return this.prisma.securitySession.findMany({
      where: {
        negocioId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: { lastActivity: 'desc' },
    });
  }

  /**
   * Update last activity timestamp for a session
   */
  async updateActivity(tokenHash: string) {
    await this.prisma.securitySession.updateMany({
      where: { tokenHash, isActive: true },
      data: { lastActivity: new Date() },
    });
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(
    sessionId: string,
    userId: number,
    negocioId: number,
    audit?: SessionAudit,
  ) {
    const session = await this.prisma.securitySession.findFirst({
      where: { id: sessionId, negocioId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Users can only revoke their own sessions unless they have admin permission
    if (session.userId !== userId) {
      throw new ForbiddenException("Cannot revoke another user's session");
    }

    const revoked = await this.prisma.securitySession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId ?? userId,
      eventType: SecurityEventType.SESSION_REVOKE,
      targetType: 'SecuritySession',
      description: `Sesión revocada por el usuario`,
      metadata: {
        module: 'security.sessions',
        action: 'revokeSession',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        sessionId,
      },
      ipAddress: audit?.context?.ipAddress,
      userAgent: audit?.context?.userAgent,
    });

    return revoked;
  }

  /**
   * Revoke a session by admin (can revoke any session in the business)
   */
  async revokeSessionAdmin(
    sessionId: string,
    negocioId: number,
    audit?: SessionAudit,
  ) {
    const session = await this.prisma.securitySession.findFirst({
      where: { id: sessionId, negocioId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const revoked = await this.prisma.securitySession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId,
      eventType: SecurityEventType.SESSION_REVOKE,
      targetType: 'SecuritySession',
      description: `Sesión revocada por administrador`,
      metadata: {
        module: 'security.sessions',
        action: 'revokeSessionAdmin',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        sessionId,
        affectedUserId: session.userId,
      },
      ipAddress: audit?.context?.ipAddress,
      userAgent: audit?.context?.userAgent,
    });

    return revoked;
  }

  /**
   * Revoke all sessions for a user (logout from all devices)
   */
  async revokeAllUserSessions(
    userId: number,
    negocioId: number,
    audit?: SessionAudit,
  ) {
    const result = await this.prisma.securitySession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId,
      eventType: SecurityEventType.SESSION_REVOKE,
      targetType: 'Usuario',
      targetId: userId,
      description: `Revocadas todas las sesiones del usuario`,
      metadata: {
        module: 'security.sessions',
        action: 'revokeAllUserSessions',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        revokedCount: result.count,
      },
      ipAddress: audit?.context?.ipAddress,
      userAgent: audit?.context?.userAgent,
    });

    return result;
  }

  /**
   * Revoke all sessions for a user except the current one
   */
  async revokeOtherSessions(
    userId: number,
    currentToken: string,
    negocioId: number,
    audit?: SessionAudit,
  ) {
    const currentTokenHash = this.hashToken(currentToken);

    const result = await this.prisma.securitySession.updateMany({
      where: {
        userId,
        isActive: true,
        tokenHash: { not: currentTokenHash },
      },
      data: { isActive: false },
    });

    await this.auditService.logSafe({
      negocioId,
      userId: audit?.actorUserId ?? userId,
      eventType: SecurityEventType.SESSION_REVOKE,
      targetType: 'Usuario',
      targetId: userId,
      description: `Revocadas sesiones de otros dispositivos`,
      metadata: {
        module: 'security.sessions',
        action: 'revokeOtherSessions',
        result: 'SUCCESS',
        actorEmail: audit?.actorEmail,
        revokedCount: result.count,
      },
      ipAddress: audit?.context?.ipAddress,
      userAgent: audit?.context?.userAgent,
    });

    return result;
  }

  /**
   * Validate a session token
   */
  async validateSession(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    const session = await this.prisma.securitySession.findFirst({
      where: {
        tokenHash,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (session) {
      // Update last activity
      await this.updateActivity(tokenHash);
      return true;
    }

    return false;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const result = await this.prisma.securitySession.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isActive: false }],
      },
    });

    return { deleted: result.count };
  }

  /**
   * Get session count for a user
   */
  async getSessionCount(userId: number): Promise<number> {
    return this.prisma.securitySession.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Hash a token for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
