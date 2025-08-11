import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Roles } from '../auth/roles.decorator';
import * as bcrypt from 'bcrypt';

@Controller('api/v1/usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Roles('ADMIN')
  @Post()
  async create(@Body() body: { email: string; nombre: string; rol: string; password: string; activo?: boolean }) {
    const passwordHash = await bcrypt.hash(body.password, 10);
    return this.service.create({
      email: body.email,
      nombre: body.nombre,
      rol: body.rol,
      activo: body.activo,
      passwordHash,
    });
  }

  @Roles('ADMIN')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{ email: string; nombre: string; rol: string; password: string; activo: boolean }>,
  ) {
    const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : undefined;
    return this.service.update(Number(id), { ...body, passwordHash });
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}


