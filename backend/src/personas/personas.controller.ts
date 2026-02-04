import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  ParseBoolPipe,
} from '@nestjs/common';
import { PersonasService } from './personas.service';
import { CreatePersonaDto, UpdatePersonaDto } from './dto';
import { NegocioId } from '../auth/negocio-id.decorator';

@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @NegocioId() negocioId: number,
    @Body() createPersonaDto: CreatePersonaDto,
  ) {
    return {
      success: true,
      message: 'Persona creada exitosamente',
      data: await this.personasService.create(negocioId, createPersonaDto),
    };
  }

  @Get()
  async findAll(
    @NegocioId() negocioId: number,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ) {
    return {
      success: true,
      message: 'Personas obtenidas exitosamente',
      data: await this.personasService.findAll(negocioId, includeInactive),
    };
  }

  @Get('active')
  async findActive(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Personas activas obtenidas exitosamente',
      data: await this.personasService.findActive(negocioId),
    };
  }

  @Get('summary')
  async getSummary(
    @NegocioId() negocioId: number,
    @Query() filters: any,
  ) {
    const data = await this.personasService.getSummary(negocioId, filters);
    return {
      success: true,
      message: 'Resumen de personas obtenido exitosamente',
      data,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    return {
      success: true,
      message: 'Persona obtenida exitosamente',
      data: await this.personasService.findOne(id, negocioId),
    };
  }

  @Get(':id/stats')
  async getStats(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    return {
      success: true,
      message: 'Estadísticas de persona obtenidas exitosamente',
      data: await this.personasService.getStats(id, negocioId),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @Body() updatePersonaDto: UpdatePersonaDto,
  ) {
    return {
      success: true,
      message: 'Persona actualizada exitosamente',
      data: await this.personasService.update(id, negocioId, updatePersonaDto),
    };
  }

  @Patch(':id/vincular-usuario')
  async vincularUsuario(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @Body('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return {
      success: true,
      message: 'Usuario vinculado exitosamente',
      data: await this.personasService.vincularUsuario(id, negocioId, usuarioId),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    const result = await this.personasService.remove(id, negocioId);
    return {
      success: true,
      message: result.message,
    };
  }
}
