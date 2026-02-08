import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Action } from '../../casl/action.enum';

@Controller('security/sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Get current user's active sessions
   */
  @Get('my')
  getMySessions(@Request() req) {
    return this.sessionsService.getActiveSessions(req.user.id, req.user.negocioId);
  }

  /**
   * Get all active sessions in the business (admin only)
   */
  @Get()
  @Permissions({ action: Action.Read, subject: 'SecuritySession' })
  getAllSessions(@Request() req) {
    return this.sessionsService.getAllActiveSessions(req.user.negocioId);
  }

  /**
   * Revoke a specific session (user can revoke their own)
   */
  @Delete(':id')
  revokeSession(@Param('id') sessionId: string, @Request() req) {
    return this.sessionsService.revokeSession(sessionId, req.user.id, req.user.negocioId);
  }

  /**
   * Revoke a session by admin (can revoke any session)
   */
  @Delete('admin/:id')
  @Permissions({ action: Action.Delete, subject: 'SecuritySession' })
  revokeSessionAdmin(@Param('id') sessionId: string, @Request() req) {
    return this.sessionsService.revokeSessionAdmin(sessionId, req.user.negocioId);
  }

  /**
   * Revoke all other sessions (logout from all other devices)
   */
  @Delete('my/others')
  revokeOtherSessions(@Request() req, @Headers('authorization') authHeader: string) {
    // Extract token from Authorization header
    const token = authHeader?.replace('Bearer ', '') || '';
    return this.sessionsService.revokeOtherSessions(req.user.id, token);
  }

  /**
   * Revoke all sessions for a user (admin action)
   */
  @Delete('user/:userId/all')
  @Permissions({ action: Action.Delete, subject: 'SecuritySession' })
  revokeAllUserSessions(@Param('userId') userId: string) {
    return this.sessionsService.revokeAllUserSessions(parseInt(userId, 10));
  }
}
