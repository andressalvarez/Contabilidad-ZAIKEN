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

@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPersonaDto: CreatePersonaDto) {
    return {
      success: true,
      message: 'Persona creada exitosamente',
      data: await this.personasService.create(createPersonaDto),
    };
  }

  @Get()
  async findAll(@Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean) {
    return {
      success: true,
      message: 'Personas obtenidas exitosamente',
      data: await this.personasService.findAll(includeInactive),
    };
  }

  @Get('active')
  async findActive() {
    return {
      success: true,
      message: 'Personas activas obtenidas exitosamente',
      data: await this.personasService.findActive(),
    };
  }

  @Get('summary')
  async getSummary(@Query() filters: any) {
    const data = await this.personasService.getSummary(filters);
    return {
      success: true,
      message: 'Resumen de personas obtenido exitosamente',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Persona obtenida exitosamente',
      data: await this.personasService.findOne(id),
    };
  }

  @Get(':id/stats')
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Estadísticas de persona obtenidas exitosamente',
      data: await this.personasService.getStats(id),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePersonaDto: UpdatePersonaDto,
  ) {
    return {
      success: true,
      message: 'Persona actualizada exitosamente',
      data: await this.personasService.update(id, updatePersonaDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.personasService.remove(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
