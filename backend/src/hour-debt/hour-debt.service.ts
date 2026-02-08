import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtDto, UpdateDebtDto } from './dto';
import { DateUtils } from '../common/utils/date.utils';
import {
  DebtStatus,
  AuditAction,
  HourDebt,
  Prisma,
  DebtDeletionReason,
} from '@prisma/client';

// Type for raw SQL result (uses snake_case from database)
type RawHourDebt = {
  id: number;
  negocio_id: number;
  usuario_id: number;
  date: Date;
  minutes_owed: number;
  remaining_minutes: number;
  reason: string | null;
  status: DebtStatus;
  created_by_id: number;
  created_at: Date;
  updated_at: Date;
  edited_by_id: number | null;
  edited_at: Date | null;
  deleted_by_id: number | null;
  deleted_at: Date | null;
};

@Injectable()
export class HourDebtService {
  private readonly logger = new Logger(HourDebtService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new hour debt
   */
  async create(
    negocioId: number,
    createDto: CreateDebtDto,
    createdById: number,
  ) {
    // Verify user exists and is active
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: createDto.usuarioId || createdById },
    });

    if (!usuario || !usuario.activo) {
      throw new BadRequestException('Usuario no encontrado o inactivo');
    }

    // Verify date is not in the future
    const normalizedDate = DateUtils.normalizeToBusinessDate(createDto.date);
    if (!DateUtils.isNotFuture(normalizedDate)) {
      throw new BadRequestException(
        'No se puede crear deuda para fechas futuras',
      );
    }

    const debt = await this.prisma.hourDebt.create({
      data: {
        negocioId,
        usuarioId: createDto.usuarioId || createdById,
        date: normalizedDate,
        minutesOwed: createDto.minutesOwed,
        remainingMinutes: createDto.minutesOwed,
        reason: createDto.reason,
        createdById,
        status: DebtStatus.ACTIVE,
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    // Log audit event
    await this.logAuditEvent(
      debt.id,
      AuditAction.CREATE,
      null,
      debt,
      createdById,
    );

    return debt;
  }

  /**
   * Find all debts with filters
   */
  async findAll(
    negocioId: number,
    filters?: {
      usuarioId?: number;
      status?: DebtStatus;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ) {
    const where: Prisma.HourDebtWhereInput = {
      negocioId,
      deletedAt: null,
    };

    if (filters?.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = DateUtils.normalizeToBusinessDate(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.date.lte = DateUtils.normalizeToBusinessDate(filters.dateTo);
      }
    }

    return this.prisma.hourDebt.findMany({
      where,
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
        createdBy: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Find debts by usuario
   */
  async findByUsuario(negocioId: number, usuarioId: number) {
    return this.prisma.hourDebt.findMany({
      where: {
        negocioId,
        usuarioId,
        deletedAt: null,
      },
      include: {
        deductions: {
          where: { deletedAt: null },
          include: {
            registroHoras: {
              select: { id: true, fecha: true, horas: true },
            },
          },
          orderBy: { deductedAt: 'desc' },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Get current debt balance for a user
   */
  async getBalance(negocioId: number, usuarioId: number): Promise<number> {
    const result = await this.prisma.hourDebt.aggregate({
      where: {
        negocioId,
        usuarioId,
        status: DebtStatus.ACTIVE,
        deletedAt: null,
      },
      _sum: { remainingMinutes: true },
    });

    return result._sum.remainingMinutes || 0;
  }

  /**
   * Find one debt by id
   */
  async findOne(id: number, negocioId: number) {
    const debt = await this.prisma.hourDebt.findFirst({
      where: {
        id,
        negocioId,
        deletedAt: null,
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
        createdBy: {
          select: { id: true, nombre: true },
        },
        editedBy: {
          select: { id: true, nombre: true },
        },
        deductions: {
          where: { deletedAt: null },
          include: {
            registroHoras: {
              select: { id: true, fecha: true, horas: true },
            },
          },
        },
      },
    });

    if (!debt) {
      throw new NotFoundException(`Deuda #${id} no encontrada`);
    }

    return debt;
  }

  /**
   * Update debt (admin only, audited)
   */
  async update(
    id: number,
    negocioId: number,
    updateDto: UpdateDebtDto,
    adminId: number,
    req?: any,
  ) {
    const before = await this.findOne(id, negocioId);

    const updated = await this.prisma.hourDebt.update({
      where: { id },
      data: {
        minutesOwed: updateDto.minutesOwed,
        remainingMinutes: updateDto.remainingMinutes,
        editedById: adminId,
        editedAt: new Date(),
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    await this.logAuditEvent(
      id,
      AuditAction.UPDATE,
      before,
      updated,
      adminId,
      updateDto.adminReason,
      req,
    );

    return updated;
  }

  /**
   * Soft delete debt (admin only)
   */
  async softDelete(id: number, negocioId: number, adminId: number, req?: any) {
    const before = await this.findOne(id, negocioId);

    const deleted = await this.prisma.hourDebt.update({
      where: { id },
      data: {
        deletedById: adminId,
        deletedAt: new Date(),
        status: DebtStatus.CANCELLED,
      },
    });

    await this.logAuditEvent(
      id,
      AuditAction.DELETE,
      before,
      deleted,
      adminId,
      'Admin deleted debt',
      req,
    );

    return { success: true, message: 'Deuda eliminada correctamente' };
  }

  /**
   * Cancel debt (admin only)
   */
  async cancel(
    id: number,
    negocioId: number,
    adminId: number,
    reason: string,
    req?: any,
  ) {
    const before = await this.findOne(id, negocioId);

    const cancelled = await this.prisma.hourDebt.update({
      where: { id },
      data: {
        status: DebtStatus.CANCELLED,
        editedById: adminId,
        editedAt: new Date(),
      },
    });

    await this.logAuditEvent(
      id,
      AuditAction.CANCEL,
      before,
      cancelled,
      adminId,
      reason,
      req,
    );

    return cancelled;
  }

  /**
   * Get deduction history for a debt
   */
  async getDeductionHistory(negocioId: number, debtId: number) {
    // Verify debt belongs to negocio
    await this.findOne(debtId, negocioId);

    return this.prisma.debtDeduction.findMany({
      where: {
        debtId,
        deletedAt: null,
      },
      include: {
        registroHoras: {
          select: {
            id: true,
            fecha: true,
            horas: true,
            usuario: {
              select: { nombre: true },
            },
          },
        },
      },
      orderBy: { deductedAt: 'desc' },
    });
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    debtId: number,
    action: AuditAction,
    beforeState: any | null,
    afterState: any,
    performedBy: number,
    adminReason?: string,
    req?: any,
  ) {
    const changedFields = beforeState
      ? Object.keys(afterState).filter(
          (key) => afterState[key] !== beforeState[key],
        )
      : [];

    return this.prisma.hourDebtAuditLog.create({
      data: {
        debtId,
        action,
        beforeState: beforeState ? JSON.parse(JSON.stringify(beforeState)) : null,
        afterState: JSON.parse(JSON.stringify(afterState)),
        changedFields,
        adminReason,
        performedBy,
        ipAddress: req?.ip,
        userAgent: req?.headers?.['user-agent'],
      },
    });
  }

  /**
   * Get audit log for a debt
   */
  async getAuditLog(id: number, negocioId: number) {
    // Verify debt belongs to negocio
    await this.findOne(id, negocioId);

    return this.prisma.hourDebtAuditLog.findMany({
      where: { debtId: id },
      include: {
        performedByUser: {
          select: { id: true, nombre: true, email: true },
        },
      },
      orderBy: { performedAt: 'desc' },
    });
  }

  /**
   * Get business statistics
   */
  async getBusinessStats(negocioId: number) {
    const [totalActiveDebt, usersWithDebt, paidThisMonth] = await Promise.all([
      // Total active debt
      this.prisma.hourDebt.aggregate({
        where: {
          negocioId,
          status: DebtStatus.ACTIVE,
          deletedAt: null,
        },
        _sum: { remainingMinutes: true },
      }),

      // Users with debt
      this.prisma.hourDebt.groupBy({
        by: ['usuarioId'],
        where: {
          negocioId,
          status: DebtStatus.ACTIVE,
          remainingMinutes: { gt: 0 },
          deletedAt: null,
        },
      }),

      // Hours paid this month
      this.prisma.debtDeduction.aggregate({
        where: {
          deductedAt: {
            gte: DateUtils.normalizeToBusinessDate(
              new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            ),
          },
          debt: { negocioId },
          deletedAt: null,
        },
        _sum: { minutesDeducted: true },
      }),
    ]);

    return {
      totalActiveDebt: totalActiveDebt._sum.remainingMinutes || 0,
      usersWithDebt: usersWithDebt.length,
      paidThisMonth: paidThisMonth._sum.minutesDeducted || 0,
    };
  }

  /**
   * Apply debt deduction with incremental excess calculation (IDEMPOTENT)
   * This is the core auto-deduction logic triggered on approval
   */
  async applyDebtDeduction(
    negocioId: number,
    usuarioId: number,
    approvedRecordId: number,
    workedHours: number, // Still using hours from existing sistema
    workDate: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;

    // Get business threshold
    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { configuracion: true },
    });
    const threshold = (negocio?.configuracion as any)?.dailyHourThreshold || 8;

    // Convert hours to minutes
    const workedMinutes = Math.round(workedHours * 60);
    const thresholdMinutes = Math.round(threshold * 60);

    // Normalize date
    const normalizedDate = DateUtils.normalizeToBusinessDate(workDate);

    // 1. Total BEFORE approving this record
    const prevTotal = await this.getTotalApprovedMinutesForDate(
      usuarioId,
      normalizedDate,
      approvedRecordId,
      prisma,
    );

    // 2. Total AFTER approving
    const newTotal = prevTotal + workedMinutes;

    // 3. Incremental excess (only the new excess)
    const prevExcess = Math.max(0, prevTotal - thresholdMinutes);
    const newExcess = Math.max(0, newTotal - thresholdMinutes);
    const incrementalExcess = newExcess - prevExcess;

    if (incrementalExcess <= 0) {
      return; // No additional excess
    }

    // 4. Get active debts with FOR UPDATE lock (prevent race conditions)
    const activeDebts = await prisma.$queryRaw<RawHourDebt[]>(
      Prisma.sql`
        SELECT * FROM hour_debts
        WHERE negocio_id = ${negocioId}
          AND usuario_id = ${usuarioId}
          AND status = ${DebtStatus.ACTIVE}::"DebtStatus"
          AND remaining_minutes > 0
          AND deleted_at IS NULL
        ORDER BY date ASC
        FOR UPDATE
      `,
    );

    if (activeDebts.length === 0) {
      return; // No debts to pay
    }

    // 5. Apply ONLY the incremental excess to debts (FIFO)
    let remainingExcess = incrementalExcess;

    for (const debt of activeDebts) {
      if (remainingExcess <= 0) break;

      const deduction = Math.min(remainingExcess, debt.remaining_minutes);

      // Create deduction record
      await prisma.debtDeduction.create({
        data: {
          debtId: debt.id,
          registroHorasId: approvedRecordId,
          minutesDeducted: deduction,
          excessMinutes: deduction,
        },
      });

      // Update debt balance
      const newBalance = debt.remaining_minutes - deduction;
      await prisma.hourDebt.update({
        where: { id: debt.id },
        data: {
          remainingMinutes: newBalance,
          status: newBalance === 0 ? DebtStatus.FULLY_PAID : DebtStatus.ACTIVE,
        },
      });

      remainingExcess -= deduction;
    }

    // 6. Log if deduction occurred
    if (incrementalExcess > remainingExcess) {
      const deducted = incrementalExcess - remainingExcess;
      this.logger.log(
        `Deuda reducida: ${deducted} min para usuario #${usuarioId} (registro #${approvedRecordId})`,
      );
    }
  }

  /**
   * Get total approved minutes for a specific date
   */
  private async getTotalApprovedMinutesForDate(
    usuarioId: number,
    workDate: Date,
    excludeRecordId?: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx || this.prisma;

    const normalizedDate = DateUtils.normalizeToBusinessDate(workDate);

    const result = await prisma.registroHoras.aggregate({
      where: {
        usuarioId,
        fecha: normalizedDate,
        aprobado: true,
        deletedAt: null,
        id: excludeRecordId ? { not: excludeRecordId } : undefined,
      },
      _sum: { horas: true },
    });

    // Convert hours to minutes
    const totalHours = result._sum.horas || 0;
    return Math.round(totalHours * 60);
  }

  /**
   * Rollback and recalculate debts when a record is rejected/edited/deleted
   */
  async rollbackAndRecalculateDebts(
    registroHorasId: number,
    negocioId: number,
    reason: DebtDeletionReason,
  ) {
    await this.prisma.$transaction(async (tx) => {
      // 1. Get all deductions associated with this record
      const deductions = await tx.debtDeduction.findMany({
        where: {
          registroHorasId,
          deletedAt: null,
        },
        include: { debt: true },
      });

      if (deductions.length === 0) return;

      // 2. Soft delete deductions (keep audit trail)
      await tx.debtDeduction.updateMany({
        where: { registroHorasId },
        data: {
          deletedAt: new Date(),
          deletedReason: reason,
        },
      });

      // 3. Recalculate balance for each affected debt
      const debtIds = [...new Set(deductions.map((d) => d.debtId))];

      for (const debtId of debtIds) {
        // Get debt with all ACTIVE deductions
        const debt = await tx.hourDebt.findUnique({
          where: { id: debtId },
          include: {
            deductions: {
              where: { deletedAt: null },
            },
          },
        });

        if (!debt) continue;

        // Calculate correct balance
        const totalDeducted = debt.deductions.reduce(
          (sum, d) => sum + d.minutesDeducted,
          0,
        );
        const correctBalance = Math.max(0, debt.minutesOwed - totalDeducted);

        // Update
        await tx.hourDebt.update({
          where: { id: debtId },
          data: {
            remainingMinutes: correctBalance,
            status: correctBalance === 0 ? DebtStatus.FULLY_PAID : DebtStatus.ACTIVE,
          },
        });
      }

      this.logger.log(
        `Rolled back ${deductions.length} debt deductions for record #${registroHorasId}, ` +
          `recalculated ${debtIds.length} debts`,
      );
    });
  }

  /**
   * Audit balances and fix discrepancies
   */
  async auditBalances(negocioId?: number) {
    const debts = await this.prisma.hourDebt.findMany({
      where: {
        negocioId,
        status: DebtStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        deductions: {
          where: { deletedAt: null },
        },
      },
    });

    const discrepancies: Array<{
      debtId: number;
      usuarioId: number;
      currentBalance: number;
      expectedBalance: number;
      difference: number;
    }> = [];

    for (const debt of debts) {
      // Calculate expected balance
      const totalDeducted = debt.deductions.reduce(
        (sum, d) => sum + d.minutesDeducted,
        0,
      );
      const expectedBalance = Math.max(0, debt.minutesOwed - totalDeducted);

      // Compare with current balance
      if (Math.abs(expectedBalance - debt.remainingMinutes) > 1) {
        // Allow 1 minute tolerance
        discrepancies.push({
          debtId: debt.id,
          usuarioId: debt.usuarioId,
          currentBalance: debt.remainingMinutes,
          expectedBalance,
          difference: debt.remainingMinutes - expectedBalance,
        });

        // Auto-correct
        await this.prisma.hourDebt.update({
          where: { id: debt.id },
          data: {
            remainingMinutes: expectedBalance,
            status: expectedBalance === 0 ? DebtStatus.FULLY_PAID : DebtStatus.ACTIVE,
          },
        });
      }
    }

    if (discrepancies.length > 0) {
      this.logger.warn(
        `Found ${discrepancies.length} balance discrepancies:`,
        discrepancies,
      );
    }

    return { fixed: discrepancies.length, discrepancies };
  }
}
