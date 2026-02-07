import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { HourDebtService } from './hour-debt.service';
import { CreateDebtDto, UpdateDebtDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NegocioId } from '../auth/negocio-id.decorator';
import { DebtStatus } from '@prisma/client';

@Controller('hour-debt')
@UseGuards(JwtAuthGuard)
export class HourDebtController {
  constructor(private readonly hourDebtService: HourDebtService) {}

  // ========================================
  // USER ENDPOINTS
  // ========================================

  /**
   * Create own debt
   * POST /hour-debt
   */
  @Post()
  async create(
    @Request() req,
    @Body() createDto: CreateDebtDto,
    @NegocioId() negocioId: number,
  ) {
    // Users can only create debt for themselves
    const targetUserId = createDto.usuarioId || req.user.userId;

    if (req.user.rol === 'USER' && targetUserId !== req.user.userId) {
      throw new ForbiddenException(
        'No puedes crear deuda para otro usuario. Solo admins pueden hacerlo.',
      );
    }

    return this.hourDebtService.create(
      negocioId,
      { ...createDto, usuarioId: targetUserId },
      req.user.userId,
    );
  }

  /**
   * Get own balance
   * GET /hour-debt/my-balance
   */
  @Get('my-balance')
  async getMyBalance(@Request() req, @NegocioId() negocioId: number) {
    const userId = req.user.userId;
    return this.hourDebtService.getBalance(negocioId, userId);
  }

  /**
   * Get own debt history
   * GET /hour-debt/my-history
   */
  @Get('my-history')
  async getMyHistory(@Request() req, @NegocioId() negocioId: number) {
    const userId = req.user.userId;
    return this.hourDebtService.findByUsuario(negocioId, userId);
  }

  // ========================================
  // ADMIN ENDPOINTS
  // ========================================

  /**
   * Get all debts (admin)
   * GET /hour-debt
   */
  @Get()
  async findAll(
    @Request() req,
    @NegocioId() negocioId: number,
    @Query('usuarioId') usuarioId?: string,
    @Query('status') status?: DebtStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // Only admins can see all debts
    if (req.user.rol !== 'ADMIN' && req.user.rol !== 'ADMIN_NEGOCIO') {
      throw new ForbiddenException('Solo admins pueden ver todas las deudas');
    }

    return this.hourDebtService.findAll(negocioId, {
      usuarioId: usuarioId ? parseInt(usuarioId, 10) : undefined,
      status,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  /**
   * Get debts by usuario (admin)
   * GET /hour-debt/usuario/:id
   */
  @Get('usuario/:id')
  async getUserDebts(
    @Request() req,
    @Param('id') id: string,
    @NegocioId() negocioId: number,
  ) {
    if (req.user.rol !== 'ADMIN' && req.user.rol !== 'ADMIN_NEGOCIO') {
      throw new ForbiddenException(
        'Solo admins pueden ver deudas de otros usuarios',
      );
    }

    return this.hourDebtService.findByUsuario(negocioId, parseInt(id, 10));
  }

  /**
   * Get specific debt (admin or owner)
   * GET /hour-debt/:id
   */
  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id') id: string,
    @NegocioId() negocioId: number,
  ) {
    const debt = await this.hourDebtService.findOne(
      parseInt(id, 10),
      negocioId,
    );

    // Check permissions
    const isOwner = debt.usuarioId === req.user.userId;
    const isAdmin =
      req.user.rol === 'ADMIN' || req.user.rol === 'ADMIN_NEGOCIO';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para ver esta deuda');
    }

    return debt;
  }

  /**
   * Update debt (admin only)
   * PATCH /hour-debt/:id
   */
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateDebtDto,
    @NegocioId() negocioId: number,
  ) {
    if (req.user.rol !== 'ADMIN' && req.user.rol !== 'ADMIN_NEGOCIO') {
      throw new ForbiddenException('Solo admins pueden editar deudas');
    }

    return this.hourDebtService.update(
      parseInt(id, 10),
      negocioId,
      updateDto,
      req.user.userId,
      req,
    );
  }

  /**
   * Soft delete debt (admin only)
   * DELETE /hour-debt/:id
   */
  @Delete(':id')
  async remove(
    @Request() req,
    @Param('id') id: string,
    @NegocioId() negocioId: number,
  ) {
    if (req.user.rol !== 'ADMIN' && req.user.rol !== 'ADMIN_NEGOCIO') {
      throw new ForbiddenException('Solo admins pueden eliminar deudas');
    }

    return this.hourDebtService.softDelete(
      parseInt(id, 10),
      negocioId,
      req.user.userId,
      req,
    );
  }

  /**
   * Cancel debt (admin only)
   * PATCH /hour-debt/:id/cancel
   */
  @Patch(':id/cancel')
  async cancel(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason: string,
    @NegocioId() negocioId: number,
  ) {
    if (req.user.rol !== 'ADMIN' && req.user.rol !== 'ADMIN_NEGOCIO') {
      throw new ForbiddenException('Solo admins pueden cancelar deudas');
    }

    return this.hourDebtService.cancel(
      parseInt(id, 10),
      negocioId,
      req.user.userId,
      reason,
      req,
    );
  }

  /**
   * Get deduction history (admin or owner)
   * GET /hour-debt/:id/deductions
   */
  @Get(':id/deductions')
  async getDeductions(
    @Request() req,
    @Param('id') id: string,
    @NegocioId() negocioId: number,
  ) {
    const debt = await this.hourDebtService.findOne(
      parseInt(id, 10),
      negocioId,
    );

    // Check permissions
    const isOwner = debt.usuarioId === req.user.userId;
    const isAdmin =
      req.user.rol === 'ADMIN' || req.user.rol === 'ADMIN_NEGOCIO';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'No tienes permiso para ver el historial de esta deuda',
      );
    }

    return this.hourDebtService.getDeductionHistory(negocioId, parseInt(id, 10));
  }

  /**
   * Get audit log (admin only)
   * GET /hour-debt/:id/audit-log
   */
  @Get(':id/audit-log')
  async getAuditLog(
    @Request() req,
    @Param('id') id: string,
    @NegocioId() negocioId: number,
  ) {
    if (req.user.rol !== 'ADMIN' && req.user.rol !== 'ADMIN_NEGOCIO') {
      throw new ForbiddenException(
        'Solo admins pueden ver el log de auditoría',
      );
    }

    return this.hourDebtService.getAuditLog(parseInt(id, 10), negocioId);
  }

  /**
   * Get business statistics (admin only)
   * GET /hour-debt/stats/business
   */
  @Get('stats/business')
  async getBusinessStats(@Request() req, @NegocioId() negocioId: number) {
    if (req.user.rol !== 'ADMIN' && req.user.rol !== 'ADMIN_NEGOCIO') {
      throw new ForbiddenException('Solo admins pueden ver estadísticas');
    }

    return this.hourDebtService.getBusinessStats(negocioId);
  }
}
