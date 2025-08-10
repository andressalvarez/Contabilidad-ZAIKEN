import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoriaDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  @Transform(({ value }) => value?.trim() || null)
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'El color debe ser un texto' })
  @MaxLength(7, { message: 'El color debe ser un código hex válido' })
  color?: string;
}
