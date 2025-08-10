import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRolDto {
  @IsString({ message: 'El nombre del rol debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  @MaxLength(100, { message: 'El nombre del rol no puede exceder 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  nombreRol: string;

  @IsInt({ message: 'La importancia debe ser un número entero' })
  @Min(0, { message: 'La importancia debe ser un valor positivo' })
  @Max(100, { message: 'La importancia no puede ser mayor a 100' })
  importancia: number;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  @Transform(({ value }) => value?.trim() || null)
  descripcion?: string;
}
