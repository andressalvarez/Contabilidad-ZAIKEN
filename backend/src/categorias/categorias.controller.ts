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

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCategoriaDto: CreateCategoriaDto) {
    return {
      success: true,
      message: 'Categoría creada exitosamente',
      data: await this.categoriasService.create(createCategoriaDto),
    };
  }

  @Get()
  async findAll() {
    return {
      success: true,
      message: 'Categorías obtenidas exitosamente',
      data: await this.categoriasService.findAll(),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return {
      success: true,
      message: 'Categoría obtenida exitosamente',
      data: await this.categoriasService.findOne(id),
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoriaDto: UpdateCategoriaDto,
  ) {
    return {
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: await this.categoriasService.update(id, updateCategoriaDto),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoriasService.remove(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
