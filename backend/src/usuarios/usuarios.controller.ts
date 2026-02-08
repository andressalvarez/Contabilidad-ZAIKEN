import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Roles } from '../auth/roles.decorator';
import { NegocioId } from '../auth/negocio-id.decorator';
import * as bcrypt from 'bcrypt';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Roles('ADMIN')
  @Get()
  async findAll(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: await this.service.findAll(negocioId),
    };
  }

  @Get('summary')
  async getSummary(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Resumen de usuarios obtenido exitosamente',
      data: await this.service.getSummary(negocioId),
    };
  }

  @Roles('ADMIN')
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    return {
      success: true,
      message: 'Usuario obtenido exitosamente',
      data: await this.service.findOne(id, negocioId),
    };
  }

  @Roles('ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @NegocioId() negocioId: number,
    @Body() body: {
      email: string;
      nombre: string;
      rol: string;
      password: string;
      activo?: boolean;
      rolId?: number;
      participacionPorc?: number;
      valorHora?: number;
      notas?: string;
    },
  ) {
    const passwordHash = await bcrypt.hash(body.password, 10);
    return {
      success: true,
      message: 'Usuario creado exitosamente',
      data: await this.service.create({
        email: body.email,
        nombre: body.nombre,
        rol: body.rol,
        activo: body.activo,
        passwordHash,
        negocioId,
        rolId: body.rolId,
        participacionPorc: body.participacionPorc,
        valorHora: body.valorHora,
        notas: body.notas,
      }),
    };
  }

  @Roles('ADMIN')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @Body() body: Partial<{
      email: string;
      nombre: string;
      rol: string;
      password: string;
      activo: boolean;
      rolId: number;
      participacionPorc: number;
      valorHora: number;
      notas: string;
    }>,
  ) {
    const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : undefined;
    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: await this.service.update(id, negocioId, {
        email: body.email,
        nombre: body.nombre,
        rol: body.rol,
        activo: body.activo,
        passwordHash,
        rolId: body.rolId,
        participacionPorc: body.participacionPorc,
        valorHora: body.valorHora,
        notas: body.notas,
      }),
    };
  }

  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    const result = await this.service.delete(id, negocioId);
    return {
      success: true,
      message: result.message,
    };
  }

  // Endpoint para que cualquier usuario actualice su propio perfil
  @Patch('me')
  async updateMe(
    @Request() req: any,
    @NegocioId() negocioId: number,
    @Body() body: Partial<{ nombre: string; email: string; password: string }>,
  ) {
    const userId = req.user.userId;
    const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : undefined;
    return {
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: await this.service.update(userId, negocioId, {
        ...body,
        passwordHash,
      }),
    };
  }

  /**
   * Admin sends password recovery email to a specific user
   */
  @Roles('ADMIN')
  @Post(':id/send-password-reset')
  @HttpCode(HttpStatus.OK)
  async sendPasswordResetToUser(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    const result = await this.service.sendPasswordResetToUser(id, negocioId);
    return {
      success: true,
      message: result.message,
    };
  }
}



