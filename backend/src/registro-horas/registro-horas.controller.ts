import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus, HttpCode, Request } from '@nestjs/common';
import { RegistroHorasService } from './registro-horas.service';
import { CreateRegistroHorasDto, UpdateRegistroHorasDto } from './dto';
import { NegocioId } from '../auth/negocio-id.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Action } from '../casl/action.enum';

@Controller('registro-horas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RegistroHorasController {
  constructor(private readonly registroHorasService: RegistroHorasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions({ action: Action.Create, subject: 'RegistroHoras' })
  async create(@NegocioId() negocioId: number, @Body() createRegistroHorasDto: CreateRegistroHorasDto) {
    return {
      success: true,
      message: 'Registro de horas creado exitosamente',
      data: await this.registroHorasService.create(negocioId, createRegistroHorasDto),
    };
  }

  @Get()
  @Permissions({ action: Action.Read, subject: 'RegistroHoras' })
  async findAll(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Registros de horas obtenidos exitosamente',
      data: await this.registroHorasService.findAll(negocioId),
    };
  }

  // ==================== APPROVAL ENDPOINTS (MUST be before ANY :id routes) ====================

  @Get('approval/pending')
  @Permissions({ action: Action.Approve, subject: 'RegistroHoras' })
  async getPending(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Registros pendientes de aprobación obtenidos exitosamente',
      data: await this.registroHorasService.getPending(negocioId),
    };
  }

  @Get('approval/rejected')
  @Permissions({ action: Action.Approve, subject: 'RegistroHoras' })
  async getRejected(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Registros rechazados obtenidos exitosamente',
      data: await this.registroHorasService.getRejected(negocioId),
    };
  }

  @Get('timers/orphaned')
  @Permissions({ action: Action.Approve, subject: 'RegistroHoras' })
  async getOrphanedTimers(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Timers huérfanos obtenidos',
      data: await this.registroHorasService.getOrphanedTimers(negocioId),
    };
  }

  @Get('stats')
  @Permissions({ action: Action.Read, subject: 'RegistroHoras' })
  async getStats(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Estadísticas de registros de horas obtenidas exitosamente',
      data: await this.registroHorasService.getStats(negocioId),
    };
  }

  @Get('usuario/:usuarioId')
  @Permissions({ action: Action.Read, subject: 'RegistroHoras' })
  async findByUsuarioId(@NegocioId() negocioId: number, @Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return {
      success: true,
      message: 'Registros de horas del usuario obtenidos exitosamente',
      data: await this.registroHorasService.findByUsuarioId(negocioId, usuarioId),
    };
  }

  // Generic :id route - MUST be after all specific routes
  @Get(':id')
  @Permissions({ action: Action.Read, subject: 'RegistroHoras' })
  async findOne(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Registro de horas obtenido exitosamente',
      data: await this.registroHorasService.findOne(id, negocioId),
    };
  }

  @Patch(':id')
  @Permissions({ action: Action.Update, subject: 'RegistroHoras' })
  async update(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRegistroHorasDto: UpdateRegistroHorasDto,
    @Request() req: any
  ) {
    const editorUserId = req.user?.userId;
    return {
      success: true,
      message: 'Registro de horas actualizado exitosamente',
      data: await this.registroHorasService.update(id, negocioId, updateRegistroHorasDto, editorUserId),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions({ action: Action.Delete, subject: 'RegistroHoras' })
  async remove(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.registroHorasService.removeWithPermissions(id, negocioId, req.user?.userId);
    return {
      success: true,
      message: 'Registro de horas eliminado exitosamente',
    };
  }

  // ==================== TIMER ENDPOINTS ====================

  @Post('timer/start')
  @HttpCode(HttpStatus.CREATED)
  @Permissions({ action: Action.Create, subject: 'RegistroHoras' })
  async startTimer(
    @NegocioId() negocioId: number,
    @Body() body: { usuarioId: number; campanaId?: number; descripcion?: string }
  ) {
    if (!body.usuarioId) {
      return {
        success: false,
        message: 'Debe proporcionar usuarioId',
      };
    }

    return {
      success: true,
      message: 'Timer iniciado exitosamente',
      data: await this.registroHorasService.startTimer(
        negocioId,
        body.usuarioId,
        body.campanaId,
        body.descripcion
      ),
    };
  }

  @Patch('timer/:id/pause')
  @Permissions({ action: Action.Update, subject: 'RegistroHoras' })
  async pauseTimer(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Timer pausado exitosamente',
      data: await this.registroHorasService.pauseTimer(negocioId, id),
    };
  }

  @Patch('timer/:id/resume')
  @Permissions({ action: Action.Update, subject: 'RegistroHoras' })
  async resumeTimer(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Timer reanudado exitosamente',
      data: await this.registroHorasService.resumeTimer(negocioId, id),
    };
  }

  @Patch('timer/:id/stop')
  @Permissions({ action: Action.Update, subject: 'RegistroHoras' })
  async stopTimer(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { descripcion?: string; timerInicio?: string; timerFin?: string }
  ) {
    return {
      success: true,
      message: 'Timer detenido exitosamente',
      data: await this.registroHorasService.stopTimer(
        negocioId,
        id,
        body?.descripcion,
        body?.timerInicio,
        body?.timerFin
      ),
    };
  }

  @Get('timer/active-usuario/:usuarioId')
  @Permissions({ action: Action.Read, subject: 'RegistroHoras' })
  async getActiveTimerByUsuario(
    @NegocioId() negocioId: number,
    @Param('usuarioId', ParseIntPipe) usuarioId: number
  ) {
    const timer = await this.registroHorasService.getActiveTimer(negocioId, usuarioId);
    return {
      success: true,
      message: timer ? 'Timer activo encontrado' : 'No hay timer activo',
      data: timer,
    };
  }

  @Delete('timer/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @Permissions({ action: Action.Delete, subject: 'RegistroHoras' })
  async cancelTimer(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number) {
    await this.registroHorasService.cancelTimer(negocioId, id);
    return {
      success: true,
      message: 'Timer cancelado exitosamente',
    };
  }

  @Patch(':id/approve')
  @Permissions({ action: Action.Approve, subject: 'RegistroHoras' })
  async approve(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ) {
    const userId = req.user.userId;
    return {
      success: true,
      message: 'Registro aprobado exitosamente',
      data: await this.registroHorasService.approve(negocioId, id, userId),
    };
  }

  @Patch(':id/reject')
  @Permissions({ action: Action.Reject, subject: 'RegistroHoras' })
  async reject(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { motivo: string }
  ) {
    return {
      success: true,
      message: 'Registro rechazado',
      data: await this.registroHorasService.reject(negocioId, id, body.motivo),
    };
  }

  // ==================== TIME EDITING ENDPOINTS ====================

  /**
   * Edita los tiempos de inicio/fin de un registro de timer
   * Recalcula las horas automáticamente
   */
  @Patch(':id/edit-times')
  @Permissions({ action: Action.Update, subject: 'RegistroHoras' })
  async editTimes(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { timerInicio?: string; timerFin?: string },
    @Request() req: any
  ) {
    const editorUserId = req.user?.userId;
    return {
      success: true,
      message: 'Tiempos actualizados exitosamente',
      data: await this.registroHorasService.updateTimerTimes(
        negocioId,
        id,
        body.timerInicio ? new Date(body.timerInicio) : undefined,
        body.timerFin ? new Date(body.timerFin) : undefined,
        editorUserId
      ),
    };
  }

  /**
   * Re-envía un registro rechazado para nueva revisión
   */
  @Patch(':id/resubmit')
  @Permissions({ action: Action.Update, subject: 'RegistroHoras' })
  async resubmit(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return {
      success: true,
      message: 'Registro re-enviado para revisión',
      data: await this.registroHorasService.resubmit(negocioId, id),
    };
  }

  /**
   * Cierra forzadamente un timer huérfano (solo admin)
   */
  @Patch('timer/:id/force-close')
  @Permissions({ action: Action.Approve, subject: 'RegistroHoras' })
  async forceCloseTimer(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ) {
    const adminUserId = req.user?.userId;
    return {
      success: true,
      message: 'Timer cerrado forzadamente',
      data: await this.registroHorasService.forceCloseTimer(negocioId, id, adminUserId),
    };
  }
}
