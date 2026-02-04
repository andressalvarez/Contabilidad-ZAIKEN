import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus, HttpCode, Request } from '@nestjs/common';
import { RegistroHorasService } from './registro-horas.service';
import { CreateRegistroHorasDto, UpdateRegistroHorasDto } from './dto';
import { NegocioId } from '../auth/negocio-id.decorator';

@Controller('registro-horas')
export class RegistroHorasController {
  constructor(private readonly registroHorasService: RegistroHorasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@NegocioId() negocioId: number, @Body() createRegistroHorasDto: CreateRegistroHorasDto) {
    return {
      success: true,
      message: 'Registro de horas creado exitosamente',
      data: await this.registroHorasService.create(negocioId, createRegistroHorasDto),
    };
  }

  @Get()
  async findAll(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Registros de horas obtenidos exitosamente',
      data: await this.registroHorasService.findAll(negocioId),
    };
  }

  @Get('stats')
  async getStats(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Estadísticas de registros de horas obtenidas exitosamente',
      data: await this.registroHorasService.getStats(negocioId),
    };
  }

  @Get('persona/:personaId')
  async findByPersonaId(@NegocioId() negocioId: number, @Param('personaId', ParseIntPipe) personaId: number) {
    return {
      success: true,
      message: 'Registros de horas de la persona obtenidos exitosamente',
      data: await this.registroHorasService.findByPersonaId(negocioId, personaId),
    };
  }

  // ✅ Nuevo endpoint para buscar por usuarioId
  @Get('usuario/:usuarioId')
  async findByUsuarioId(@NegocioId() negocioId: number, @Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return {
      success: true,
      message: 'Registros de horas del usuario obtenidos exitosamente',
      data: await this.registroHorasService.findByUsuarioId(negocioId, usuarioId),
    };
  }

  @Get(':id')
  async findOne(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Registro de horas obtenido exitosamente',
      data: await this.registroHorasService.findOne(id, negocioId),
    };
  }

  @Patch(':id')
  async update(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number, @Body() updateRegistroHorasDto: UpdateRegistroHorasDto) {
    return {
      success: true,
      message: 'Registro de horas actualizado exitosamente',
      data: await this.registroHorasService.update(id, negocioId, updateRegistroHorasDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number) {
    await this.registroHorasService.remove(id, negocioId);
    return {
      success: true,
      message: 'Registro de horas eliminado exitosamente',
    };
  }

  // ==================== TIMER ENDPOINTS ====================

  @Post('timer/start')
  @HttpCode(HttpStatus.CREATED)
  async startTimer(
    @NegocioId() negocioId: number,
    @Body() body: { usuarioId?: number; personaId?: number; campanaId?: number; descripcion?: string }
  ) {
    // ✅ Priorizar usuarioId, fallback a personaId para compatibilidad
    const id = body.usuarioId || body.personaId;
    if (!id) {
      return {
        success: false,
        message: 'Debe proporcionar usuarioId o personaId',
      };
    }

    return {
      success: true,
      message: 'Timer iniciado exitosamente',
      data: await this.registroHorasService.startTimer(
        negocioId,
        id,
        body.campanaId,
        body.descripcion
      ),
    };
  }

  @Patch('timer/:id/pause')
  async pauseTimer(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Timer pausado exitosamente',
      data: await this.registroHorasService.pauseTimer(negocioId, id),
    };
  }

  @Patch('timer/:id/resume')
  async resumeTimer(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Timer reanudado exitosamente',
      data: await this.registroHorasService.resumeTimer(negocioId, id),
    };
  }

  @Patch('timer/:id/stop')
  async stopTimer(
    @NegocioId() negocioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { descripcion?: string }
  ) {
    return {
      success: true,
      message: 'Timer detenido exitosamente',
      data: await this.registroHorasService.stopTimer(negocioId, id, body?.descripcion),
    };
  }

  @Get('timer/active/:personaId')
  async getActiveTimer(
    @NegocioId() negocioId: number,
    @Param('personaId', ParseIntPipe) personaId: number
  ) {
    const timer = await this.registroHorasService.getActiveTimer(negocioId, personaId);
    return {
      success: true,
      message: timer ? 'Timer activo encontrado' : 'No hay timer activo',
      data: timer,
    };
  }

  // ✅ Nuevo endpoint para obtener timer activo por usuarioId
  @Get('timer/active-usuario/:usuarioId')
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
  async cancelTimer(@NegocioId() negocioId: number, @Param('id', ParseIntPipe) id: number) {
    await this.registroHorasService.cancelTimer(negocioId, id);
    return {
      success: true,
      message: 'Timer cancelado exitosamente',
    };
  }

  // ==================== APPROVAL ENDPOINTS ====================

  @Get('pending')
  async getPending(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Registros pendientes de aprobación obtenidos exitosamente',
      data: await this.registroHorasService.getPending(negocioId),
    };
  }

  @Get('rejected')
  async getRejected(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Registros rechazados obtenidos exitosamente',
      data: await this.registroHorasService.getRejected(negocioId),
    };
  }

  @Patch(':id/approve')
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
}
