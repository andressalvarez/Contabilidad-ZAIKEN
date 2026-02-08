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
  UseGuards,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { NegocioId } from '../auth/negocio-id.decorator';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Action } from '../casl/action.enum';
import { extractRequestContext } from '../common/utils/request-context.util';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Permissions({ action: Action.Read, subject: 'Usuario' })
  @Get()
  async findAll(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: await this.service.findAll(negocioId),
    };
  }

  @Get('summary')
  @Permissions({ action: Action.Read, subject: 'Usuario' })
  async getSummary(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Resumen de usuarios obtenido exitosamente',
      data: await this.service.getSummary(negocioId),
    };
  }

  @Permissions({ action: Action.Read, subject: 'Usuario' })
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

  @Permissions({ action: Action.Create, subject: 'Usuario' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: any,
    @NegocioId() negocioId: number,
    @Body()
    body: {
      email: string;
      nombre: string;
      securityRoleId: number;
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
      data: await this.service.create(
        {
          email: body.email,
          nombre: body.nombre,
          securityRoleId: body.securityRoleId,
          activo: body.activo,
          passwordHash,
          negocioId,
          rolId: body.rolId,
          participacionPorc: body.participacionPorc,
          valorHora: body.valorHora,
          notas: body.notas,
        },
        {
          actorUserId: req.user.userId,
          actorEmail: req.user.email,
          context: extractRequestContext(req),
        },
      ),
    };
  }

  @Permissions({ action: Action.Update, subject: 'Usuario' })
  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @Body()
    body: Partial<{
      email: string;
      nombre: string;
      securityRoleId: number;
      password: string;
      activo: boolean;
      rolId: number;
      participacionPorc: number;
      valorHora: number;
      notas: string;
    }>,
  ) {
    const passwordHash = body.password
      ? await bcrypt.hash(body.password, 10)
      : undefined;
    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: await this.service.update(
        id,
        negocioId,
        {
          email: body.email,
          nombre: body.nombre,
          securityRoleId: body.securityRoleId,
          activo: body.activo,
          passwordHash,
          rolId: body.rolId,
          participacionPorc: body.participacionPorc,
          valorHora: body.valorHora,
          notas: body.notas,
        },
        {
          actorUserId: req.user.userId,
          actorEmail: req.user.email,
          context: extractRequestContext(req),
        },
      ),
    };
  }

  @Permissions({ action: Action.Delete, subject: 'Usuario' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    const result = await this.service.delete(id, negocioId, {
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
      context: extractRequestContext(req),
    });
    return {
      success: true,
      message: result.message,
    };
  }

  // Endpoint para que cualquier usuario actualice su propio perfil
  @Patch('me')
  @Permissions({ action: Action.Update, subject: 'Usuario' })
  async updateMe(
    @Request() req: any,
    @NegocioId() negocioId: number,
    @Body() body: Partial<{ nombre: string; email: string; password: string }>,
  ) {
    const userId = req.user.userId;
    const passwordHash = body.password
      ? await bcrypt.hash(body.password, 10)
      : undefined;
    return {
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: await this.service.update(
        userId,
        negocioId,
        {
          ...body,
          passwordHash,
        },
        {
          actorUserId: req.user.userId,
          actorEmail: req.user.email,
          context: extractRequestContext(req),
        },
      ),
    };
  }

  /**
   * Admin sends password recovery email to a specific user
   */
  @Permissions({ action: Action.Update, subject: 'Usuario' })
  @Post(':id/send-password-reset')
  @HttpCode(HttpStatus.OK)
  async sendPasswordResetToUser(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    const result = await this.service.sendPasswordResetToUser(id, negocioId, {
      actorUserId: req.user.userId,
      actorEmail: req.user.email,
      context: extractRequestContext(req),
    });
    return {
      success: true,
      message: result.message,
    };
  }
}
