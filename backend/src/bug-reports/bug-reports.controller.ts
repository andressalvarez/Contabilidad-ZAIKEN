import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { BugReportStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Action } from '../casl/action.enum';
import { extractRequestContext } from '../common/utils/request-context.util';
import { BugReportsService } from './bug-reports.service';
import {
  CreateBugReportDto,
  UpdateBugReportStatusDto,
} from './dto';

@Controller('bug-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BugReportsController {
  constructor(private readonly bugReportsService: BugReportsService) {}

  @Post()
  async create(@Body() dto: CreateBugReportDto, @Request() req: any) {
    const data = await this.bugReportsService.create({
      negocioId: req.user.negocioId,
      reporterId: req.user.userId,
      description: dto.description,
      evidenceUrl: dto.evidenceUrl,
      moduleUrl: dto.moduleUrl,
      referer: req.headers?.referer,
      actorEmail: req.user.email,
      context: extractRequestContext(req),
    });

    return {
      success: true,
      message: 'Reporte de bug enviado',
      data,
    };
  }

  @Get()
  @Permissions({ action: Action.Read, subject: 'SecurityRole' })
  findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    let normalizedStatus: BugReportStatus | undefined;
    if (status) {
      const upperStatus = status.toUpperCase();
      if (!Object.values(BugReportStatus).includes(upperStatus as BugReportStatus)) {
        throw new BadRequestException('Invalid status filter');
      }
      normalizedStatus = upperStatus as BugReportStatus;
    }

    return this.bugReportsService.findAll({
      negocioId: req.user.negocioId,
      status: normalizedStatus,
      search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Patch(':id/status')
  @Permissions({ action: Action.Update, subject: 'SecurityRole' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBugReportStatusDto,
    @Request() req: any,
  ) {
    const data = await this.bugReportsService.updateStatus({
      id,
      negocioId: req.user.negocioId,
      status: dto.status,
      resolvedById: req.user.userId,
      actorEmail: req.user.email,
      context: extractRequestContext(req),
    });

    return {
      success: true,
      message: 'Estado del reporte actualizado',
      data,
    };
  }
}
