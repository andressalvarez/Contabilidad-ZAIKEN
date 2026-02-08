import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRolDto, UpdateRolDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermission('BUSINESS_ROLE.GLOBAL.CREATE')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRolDto: CreateRolDto) {
    return {
      success: true,
      message: 'Rol creado exitosamente',
      data: await this.rolesService.create(createRolDto),
    };
  }

  @Get()
  @RequirePermission('BUSINESS_ROLE.GLOBAL.READ')
  async findAll() {
    return {
      success: true,
      message: 'Roles obtenidos exitosamente',
      data: await this.rolesService.findAll(),
    };
  }

  @Get('active')
  @RequirePermission('BUSINESS_ROLE.GLOBAL.READ')
  async findActive() {
    return {
      success: true,
      message: 'Roles activos obtenidos exitosamente',
      data: await this.rolesService.findActive(),
    };
  }

  @Get(':id')
  @RequirePermission('BUSINESS_ROLE.GLOBAL.READ')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Rol obtenido exitosamente',
      data: await this.rolesService.findOne(id),
    };
  }

  @Get(':id/stats')
  @RequirePermission('BUSINESS_ROLE.GLOBAL.READ')
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Estadísticas del rol obtenidas exitosamente',
      data: await this.rolesService.getStats(id),
    };
  }

  @Patch(':id')
  @RequirePermission('BUSINESS_ROLE.GLOBAL.UPDATE')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRolDto: UpdateRolDto,
  ) {
    return {
      success: true,
      message: 'Rol actualizado exitosamente',
      data: await this.rolesService.update(id, updateRolDto),
    };
  }

  @Delete(':id')
  @RequirePermission('BUSINESS_ROLE.GLOBAL.DELETE')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.rolesService.remove(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
