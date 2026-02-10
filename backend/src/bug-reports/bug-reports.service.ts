import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BugReportStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, SecurityEventType } from '../security/audit/audit.service';
import { RequestContext } from '../common/utils/request-context.util';

type CreateBugReportParams = {
  negocioId: number;
  reporterId: number;
  description: string;
  evidenceUrl: string;
  moduleUrl?: string;
  referer?: string | string[];
  actorEmail?: string;
  context?: RequestContext;
};

type FindBugReportsParams = {
  negocioId: number;
  status?: BugReportStatus;
  search?: string;
  page?: number;
  limit?: number;
};

type UpdateBugReportStatusParams = {
  id: number;
  negocioId: number;
  status: BugReportStatus;
  resolvedById: number;
  actorEmail?: string;
  context?: RequestContext;
};

@Injectable()
export class BugReportsService {
  private readonly allowedLightshotHosts = new Set(['prnt.sc', 'prntscr.com']);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(params: CreateBugReportParams) {
    const description = params.description?.trim();
    if (!description) {
      throw new BadRequestException('La descripcion es requerida');
    }

    const evidenceUrl = params.evidenceUrl?.trim();
    if (!evidenceUrl) {
      throw new BadRequestException('La URL de evidencia es requerida');
    }
    this.assertLightshotUrl(evidenceUrl);

    const resolvedModuleUrl = this.resolveModuleUrl(
      params.moduleUrl,
      params.referer,
    );

    const report = await this.prisma.bugReport.create({
      data: {
        negocioId: params.negocioId,
        reporterId: params.reporterId,
        description,
        evidenceUrl,
        moduleUrl: resolvedModuleUrl,
      },
      include: {
        reporter: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    await this.auditService.logSafe({
      negocioId: params.negocioId,
      userId: params.reporterId,
      eventType: SecurityEventType.BUG_REPORT_CREATE,
      targetType: 'BugReport',
      targetId: report.id,
      description: `Reporte de bug creado (#${report.id})`,
      metadata: {
        module: 'bug-reports',
        action: 'create',
        result: 'SUCCESS',
        actorEmail: params.actorEmail,
        moduleUrl: report.moduleUrl,
        evidenceUrl: report.evidenceUrl,
      },
      ipAddress: params.context?.ipAddress,
      userAgent: params.context?.userAgent,
    });

    return report;
  }

  async findAll(params: FindBugReportsParams) {
    const page = this.normalizePage(params.page);
    const limit = this.normalizeLimit(params.limit);
    const search = params.search?.trim();

    const where: Prisma.BugReportWhereInput = {
      negocioId: params.negocioId,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { moduleUrl: { contains: search, mode: 'insensitive' } },
        { evidenceUrl: { contains: search, mode: 'insensitive' } },
        { reporter: { nombre: { contains: search, mode: 'insensitive' } } },
        { reporter: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.bugReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          resolvedBy: {
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
      this.prisma.bugReport.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(params: UpdateBugReportStatusParams) {
    const existing = await this.prisma.bugReport.findFirst({
      where: {
        id: params.id,
        negocioId: params.negocioId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Bug report with ID ${params.id} not found`);
    }

    const data: Prisma.BugReportUpdateInput =
      params.status === BugReportStatus.RESOLVED
        ? {
            status: BugReportStatus.RESOLVED,
            resolvedAt: new Date(),
            resolvedBy: { connect: { id: params.resolvedById } },
          }
        : {
            status: BugReportStatus.OPEN,
            resolvedAt: null,
            resolvedBy: { disconnect: true },
          };

    const updated = await this.prisma.bugReport.update({
      where: { id: params.id },
      data,
      include: {
        reporter: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    await this.auditService.logSafe({
      negocioId: params.negocioId,
      userId: params.resolvedById,
      eventType: SecurityEventType.BUG_REPORT_STATUS_UPDATE,
      targetType: 'BugReport',
      targetId: updated.id,
      description: `Estado de bug report #${updated.id}: ${existing.status} -> ${updated.status}`,
      metadata: {
        module: 'bug-reports',
        action: 'status-update',
        result: 'SUCCESS',
        actorEmail: params.actorEmail,
        beforeStatus: existing.status,
        afterStatus: updated.status,
      },
      ipAddress: params.context?.ipAddress,
      userAgent: params.context?.userAgent,
    });

    return updated;
  }

  private normalizePage(page?: number): number {
    if (!page || Number.isNaN(page)) return 1;
    return Math.max(1, Math.floor(page));
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || Number.isNaN(limit)) return 20;
    return Math.min(100, Math.max(1, Math.floor(limit)));
  }

  private assertLightshotUrl(url: string) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('La URL de evidencia no es valida');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException(
        'La URL de evidencia debe iniciar con http o https',
      );
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (!this.allowedLightshotHosts.has(host)) {
      throw new BadRequestException(
        'La evidencia debe ser una URL de Lightshot (prnt.sc o prntscr.com)',
      );
    }
  }

  private resolveModuleUrl(
    moduleUrl?: string,
    referer?: string | string[],
  ): string {
    const refererValue = Array.isArray(referer) ? referer[0] : referer;
    const candidate = moduleUrl?.trim() || refererValue?.trim();
    if (!candidate) {
      return 'unknown';
    }

    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'unknown';
      }
      return parsed.toString();
    } catch {
      return 'unknown';
    }
  }
}
