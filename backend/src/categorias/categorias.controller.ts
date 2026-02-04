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
} from '@nestjs/common';
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { NegocioId } from '../auth/negocio-id.decorator';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @NegocioId() negocioId: number,
    @Body() createCategoriaDto: CreateCategoriaDto,
  ) {
    return {
      success: true,
      message: 'Categoría creada exitosamente',
      data: await this.categoriasService.create(negocioId, createCategoriaDto),
    };
  }

  @Get()
  async findAll(@NegocioId() negocioId: number) {
    return {
      success: true,
      message: 'Categorías obtenidas exitosamente',
      data: await this.categoriasService.findAll(negocioId),
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    return {
      success: true,
      message: 'Categoría obtenida exitosamente',
      data: await this.categoriasService.findOne(id, negocioId),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @Body() updateCategoriaDto: UpdateCategoriaDto,
  ) {
    return {
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: await this.categoriasService.update(id, negocioId, updateCategoriaDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
  ) {
    const result = await this.categoriasService.remove(id, negocioId);
    return {
      success: true,
      message: result.message,
    };
  }
}
