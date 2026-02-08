import { Controller, Get, Query, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Action } from '../../casl/action.enum';

@Controller('security/audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions({ action: Action.Read, subject: 'SecurityAuditLog' })
  findAll(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('eventType') eventType?: string,
    @Query('targetType') targetType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findAll({
      negocioId: req.user.negocioId,
      userId: userId ? parseInt(userId, 10) : undefined,
      eventType,
      targetType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('event-types')
  @Permissions({ action: Action.Read, subject: 'SecurityAuditLog' })
  getEventTypes() {
    return this.auditService.getEventTypes();
  }

  @Get('summary')
  @Permissions({ action: Action.Read, subject: 'SecurityAuditLog' })
  getSummary(@Request() req, @Query('days') days?: string) {
    return this.auditService.getSummary(
      req.user.negocioId,
      days ? parseInt(days, 10) : 7,
    );
  }

  @Get('target/:type/:id')
  @Permissions({ action: Action.Read, subject: 'SecurityAuditLog' })
  findByTarget(
    @Request() req,
    @Param('type') targetType: string,
    @Param('id', ParseIntPipe) targetId: number,
  ) {
    return this.auditService.findByTarget(req.user.negocioId, targetType, targetId);
  }
}
