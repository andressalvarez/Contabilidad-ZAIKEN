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

@Controller('api/v1/usuarios')
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
  async create(@Body() body: { email: string; nombre: string; rol: string; password: string; activo?: boolean; negocioId: number }) {
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
        negocioId: body.negocioId,
      }),
    };
  }

  @Roles('ADMIN')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @Body() body: Partial<{ email: string; nombre: string; rol: string; password: string; activo: boolean }>,
  ) {
    const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : undefined;
    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: await this.service.update(id, negocioId, { ...body, passwordHash }),
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
}



