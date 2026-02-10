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
   * Runs a monthly audit to validate debt deductions.
   * It compares, per user, the month's excess minutes vs deducted minutes.
   */
  async requestMonthlyReview(negocioId: number, requestedBy: number) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = now;

    // First, fix structural balance discrepancies.
    let balanceAudit = await this.auditBalances(negocioId);

    const negocio = await this.prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { configuracion: true },
    });
    const threshold = (negocio?.configuracion as any)?.dailyHourThreshold || 8;
    const thresholdMinutes = Math.round(threshold * 60);

    const autoApplySummary = await this.autoApplyMissingDeductionsForPeriod(
      negocioId,
      monthStart,
      monthEnd,
      thresholdMinutes,
    );

    // Re-check balances after applying missing deductions.
    balanceAudit = await this.auditBalances(negocioId);

    const approvedRecords = await this.prisma.registroHoras.findMany({
      where: {
        negocioId,
        aprobado: true,
        deletedAt: null,
        fecha: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        id: true,
        usuarioId: true,
        fecha: true,
        horas: true,
      },
    });

    const deductions = await this.prisma.debtDeduction.findMany({
      where: {
        deletedAt: null,
        debt: { negocioId },
        registroHoras: {
          fecha: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      },
      select: {
        minutesDeducted: true,
        registroHoras: {
          select: {
            usuarioId: true,
            fecha: true,
          },
        },
      },
    });

    // Business rule: only evaluate expected debt discounts from the debt creation date onward.
    const debtCreationRows = await this.prisma.hourDebt.findMany({
      where: {
        negocioId,
        createdAt: { lte: monthEnd },
        deletedAt: null,
      },
      select: {
        usuarioId: true,
        createdAt: true,
      },
    });

    const firstDebtDayByUser = new Map<number, string>();
    for (const debt of debtCreationRows) {
      const createdDay = DateUtils.formatDate(debt.createdAt);
      const existing = firstDebtDayByUser.get(debt.usuarioId);
      if (!existing || createdDay < existing) {
        firstDebtDayByUser.set(debt.usuarioId, createdDay);
      }
    }

    const dailyApprovedByUser = new Map<string, number>();
    for (const record of approvedRecords) {
      const firstDebtDay = firstDebtDayByUser.get(record.usuarioId);
      if (!firstDebtDay) {
        continue;
      }

      const day = DateUtils.formatDate(record.fecha);
      if (day < firstDebtDay) {
        continue;
      }

      const key = `${record.usuarioId}:${day}`;
      const minutes = Math.round((record.horas || 0) * 60);
      dailyApprovedByUser.set(key, (dailyApprovedByUser.get(key) || 0) + minutes);
    }

    const excessByUser = new Map<number, number>();
    for (const [key, totalMinutes] of dailyApprovedByUser.entries()) {
      const [userIdRaw] = key.split(':');
      const userId = Number.parseInt(userIdRaw, 10);
      const dailyExcess = Math.max(0, totalMinutes - thresholdMinutes);
      if (dailyExcess > 0) {
        excessByUser.set(userId, (excessByUser.get(userId) || 0) + dailyExcess);
      }
    }

    const deductedByUser = new Map<number, number>();
    for (const deduction of deductions) {
      const userId = deduction.registroHoras?.usuarioId;
      if (!userId) continue;
      deductedByUser.set(
        userId,
        (deductedByUser.get(userId) || 0) + deduction.minutesDeducted,
      );
    }

    const userIds = Array.from(
      new Set([...excessByUser.keys(), ...deductedByUser.keys()]),
    );

    const usersData = await this.prisma.usuario.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nombre: true, email: true },
    });
    const usersMap = new Map(usersData.map((u) => [u.id, u]));

    const users = userIds
      .map((userId) => {
        const expectedExcessMinutes = excessByUser.get(userId) || 0;
        const deductedMinutes = deductedByUser.get(userId) || 0;
        const gapMinutes = expectedExcessMinutes - deductedMinutes;
        const user = usersMap.get(userId);

        return {
          usuarioId: userId,
          nombre: user?.nombre || `Usuario #${userId}`,
          email: user?.email || '',
          expectedExcessMinutes,
          deductedMinutes,
          gapMinutes,
          requiresManualReview: gapMinutes !== 0,
        };
      })
      .sort((a, b) => Math.abs(b.gapMinutes) - Math.abs(a.gapMinutes));

    const usersWithGaps = users.filter((u) => u.requiresManualReview).length;
    const totalExpectedExcessMinutes = users.reduce(
      (sum, u) => sum + u.expectedExcessMinutes,
      0,
    );
    const totalDeductedMinutes = users.reduce((sum, u) => sum + u.deductedMinutes, 0);
    const remainingGapMinutes = Math.max(
      0,
      totalExpectedExcessMinutes - totalDeductedMinutes,
    );

    this.logger.log(
      `Auditoria mensual de deuda ejecutada. negocio=${negocioId}, solicitadoPor=${requestedBy}, usuarios=${users.length}, usuariosConDiferencia=${usersWithGaps}, autoAplicadoMin=${autoApplySummary.autoAppliedMinutes}`,
    );

    return {
      requestedAt: new Date().toISOString(),
      requestedBy,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      thresholdHours: threshold,
      usersAnalyzed: users.length,
      usersWithGaps,
      totalExpectedExcessMinutes,
      totalDeductedMinutes,
      remainingGapMinutes,
      balanceFixesApplied: balanceAudit.fixed,
      autoAppliedMinutes: autoApplySummary.autoAppliedMinutes,
      autoAppliedUsers: autoApplySummary.autoAppliedUsers,
      autoAppliedUserDays: autoApplySummary.autoAppliedUserDays,
      deductionOperations: autoApplySummary.deductionOperations,
      users,
      message:
        'Auditoria mensual de deuda ejecutada y descuentos faltantes aplicados',
    };
  }

  /**
   * Reapply missing debt deductions for a period.
   * Rule: only discount from debt creation day onward.
   */
  private async autoApplyMissingDeductionsForPeriod(
    negocioId: number,
    periodStart: Date,
    periodEnd: Date,
    thresholdMinutes: number,
  ): Promise<{
    autoAppliedMinutes: number;
    autoAppliedUsers: number;
    autoAppliedUserDays: number;
    deductionOperations: number;
  }> {
    const approvedRecords = await this.prisma.registroHoras.findMany({
      where: {
        negocioId,
        aprobado: true,
        deletedAt: null,
        fecha: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        usuarioId: true,
        fecha: true,
        horas: true,
      },
      orderBy: [{ fecha: 'asc' }, { id: 'asc' }],
    });

    if (approvedRecords.length === 0) {
      return {
        autoAppliedMinutes: 0,
        autoAppliedUsers: 0,
        autoAppliedUserDays: 0,
        deductionOperations: 0,
      };
    }

    const [debtCreationRows, existingDeductions, activeDebts] = await Promise.all([
      this.prisma.hourDebt.findMany({
        where: {
          negocioId,
          createdAt: { lte: periodEnd },
          deletedAt: null,
        },
        select: {
          usuarioId: true,
          createdAt: true,
        },
      }),
      this.prisma.debtDeduction.findMany({
        where: {
          deletedAt: null,
          debt: { negocioId },
          registroHoras: {
            fecha: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        },
        select: {
          id: true,
          debtId: true,
          registroHorasId: true,
          minutesDeducted: true,
          excessMinutes: true,
          registroHoras: {
            select: {
              usuarioId: true,
              fecha: true,
            },
          },
        },
      }),
      this.prisma.hourDebt.findMany({
        where: {
          negocioId,
          status: DebtStatus.ACTIVE,
          remainingMinutes: { gt: 0 },
          createdAt: { lte: periodEnd },
          deletedAt: null,
        },
        select: {
          id: true,
          usuarioId: true,
          date: true,
          createdAt: true,
          remainingMinutes: true,
        },
        orderBy: [{ date: 'asc' }, { id: 'asc' }],
      }),
    ]);

    const firstDebtDayByUser = new Map<number, string>();
    for (const debt of debtCreationRows) {
      const createdDay = DateUtils.formatDate(debt.createdAt);
      const existing = firstDebtDayByUser.get(debt.usuarioId);
      if (!existing || createdDay < existing) {
        firstDebtDayByUser.set(debt.usuarioId, createdDay);
      }
    }

    type UserDayAggregate = {
      usuarioId: number;
      day: string;
      totalApprovedMinutes: number;
      recordIds: number[];
    };
    const approvedByUserDay = new Map<string, UserDayAggregate>();

    for (const record of approvedRecords) {
      const firstDebtDay = firstDebtDayByUser.get(record.usuarioId);
      if (!firstDebtDay) continue;

      const day = DateUtils.formatDate(record.fecha);
      if (day < firstDebtDay) continue;

      const key = `${record.usuarioId}:${day}`;
      const minutes = Math.round((record.horas || 0) * 60);
      const current = approvedByUserDay.get(key);
      if (current) {
        current.totalApprovedMinutes += minutes;
        current.recordIds.push(record.id);
      } else {
        approvedByUserDay.set(key, {
          usuarioId: record.usuarioId,
          day,
          totalApprovedMinutes: minutes,
          recordIds: [record.id],
        });
      }
    }

    const deductedByUserDay = new Map<string, number>();
    const deductionByDebtAndRecord = new Map<
      string,
      {
        id: number;
        minutesDeducted: number;
        excessMinutes: number;
      }
    >();

    for (const deduction of existingDeductions) {
      const userId = deduction.registroHoras?.usuarioId;
      if (!userId) continue;

      const day = DateUtils.formatDate(deduction.registroHoras.fecha);
      const userDayKey = `${userId}:${day}`;
      deductedByUserDay.set(
        userDayKey,
        (deductedByUserDay.get(userDayKey) || 0) + deduction.minutesDeducted,
      );

      deductionByDebtAndRecord.set(
        `${deduction.debtId}:${deduction.registroHorasId}`,
        {
          id: deduction.id,
          minutesDeducted: deduction.minutesDeducted,
          excessMinutes: deduction.excessMinutes,
        },
      );
    }

    const debtsByUser = new Map<
      number,
      Array<{
        id: number;
        createdDay: string;
        remainingMinutes: number;
      }>
    >();
    for (const debt of activeDebts) {
      const userDebts = debtsByUser.get(debt.usuarioId) || [];
      userDebts.push({
        id: debt.id,
        createdDay: DateUtils.formatDate(debt.createdAt),
        remainingMinutes: debt.remainingMinutes,
      });
      debtsByUser.set(debt.usuarioId, userDebts);
    }

    const userDayEntries = Array.from(approvedByUserDay.values()).sort((a, b) => {
      const dayCompare = a.day.localeCompare(b.day);
      if (dayCompare !== 0) return dayCompare;
      return a.usuarioId - b.usuarioId;
    });

    let autoAppliedMinutes = 0;
    let deductionOperations = 0;
    let autoAppliedUserDays = 0;
    const touchedUsers = new Set<number>();
    const changedDebts = new Set<number>();

    await this.prisma.$transaction(async (tx) => {
      for (const entry of userDayEntries) {
        const dailyExcess = Math.max(0, entry.totalApprovedMinutes - thresholdMinutes);
        if (dailyExcess <= 0) continue;

        const userDayKey = `${entry.usuarioId}:${entry.day}`;
        const alreadyDeducted = deductedByUserDay.get(userDayKey) || 0;
        let missingMinutes = dailyExcess - alreadyDeducted;
        if (missingMinutes <= 0) continue;

        const userDebts = debtsByUser.get(entry.usuarioId) || [];
        if (userDebts.length === 0) continue;

        const anchorRecordId = entry.recordIds[entry.recordIds.length - 1];
        let appliedInThisDay = 0;

        for (const debt of userDebts) {
          if (missingMinutes <= 0) break;
          if (debt.remainingMinutes <= 0) continue;
          if (entry.day < debt.createdDay) continue;

          const deductAmount = Math.min(missingMinutes, debt.remainingMinutes);
          if (deductAmount <= 0) continue;

          const pairKey = `${debt.id}:${anchorRecordId}`;
          const existing = deductionByDebtAndRecord.get(pairKey);

          if (existing) {
            const nextMinutesDeducted = existing.minutesDeducted + deductAmount;
            const nextExcessMinutes = existing.excessMinutes + deductAmount;
            await tx.debtDeduction.update({
              where: { id: existing.id },
              data: {
                minutesDeducted: nextMinutesDeducted,
                excessMinutes: nextExcessMinutes,
              },
            });
            deductionByDebtAndRecord.set(pairKey, {
              id: existing.id,
              minutesDeducted: nextMinutesDeducted,
              excessMinutes: nextExcessMinutes,
            });
          } else {
            const created = await tx.debtDeduction.create({
              data: {
                debtId: debt.id,
                registroHorasId: anchorRecordId,
                minutesDeducted: deductAmount,
                excessMinutes: deductAmount,
              },
              select: { id: true },
            });
            deductionByDebtAndRecord.set(pairKey, {
              id: created.id,
              minutesDeducted: deductAmount,
              excessMinutes: deductAmount,
            });
          }

          debt.remainingMinutes -= deductAmount;
          missingMinutes -= deductAmount;
          appliedInThisDay += deductAmount;
          autoAppliedMinutes += deductAmount;
          deductionOperations += 1;
          changedDebts.add(debt.id);
          touchedUsers.add(entry.usuarioId);
        }

        if (appliedInThisDay > 0) {
          autoAppliedUserDays += 1;
          deductedByUserDay.set(userDayKey, alreadyDeducted + appliedInThisDay);
        }
      }

      if (changedDebts.size > 0) {
        const debtUpdates = Array.from(debtsByUser.values())
          .flat()
          .filter((debt) => changedDebts.has(debt.id));

        for (const debt of debtUpdates) {
          await tx.hourDebt.update({
            where: { id: debt.id },
            data: {
              remainingMinutes: debt.remainingMinutes,
              status:
                debt.remainingMinutes === 0
                  ? DebtStatus.FULLY_PAID
                  : DebtStatus.ACTIVE,
            },
          });
        }
      }
    });

    return {
      autoAppliedMinutes,
      autoAppliedUsers: touchedUsers.size,
      autoAppliedUserDays,
      deductionOperations,
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
      negocioId,
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
          AND created_at::date <= ${normalizedDate}::date
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
    negocioId: number,
    usuarioId: number,
    workDate: Date,
    excludeRecordId?: number,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const prisma = tx || this.prisma;

    const normalizedDate = DateUtils.normalizeToBusinessDate(workDate);
    const { start, end } = DateUtils.getDateRange(normalizedDate);

    const result = await prisma.registroHoras.aggregate({
      where: {
        negocioId,
        usuarioId,
        fecha: {
          gte: start,
          lte: end,
        },
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
