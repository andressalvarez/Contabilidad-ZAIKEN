import { IsString, IsNotEmpty, IsOptional, IsInt, IsDecimal, Min, Max, MaxLength, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreatePersonaDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @IsInt({ message: 'El ID del rol debe ser un número entero' })
  @Min(1, { message: 'El ID del rol debe ser válido' })
  @Type(() => Number)
  rolId: number;

  @IsOptional()
  @IsInt({ message: 'El ID del usuario debe ser un número entero' })
  @Min(1, { message: 'El ID del usuario debe ser válido' })
  @Type(() => Number)
  usuarioId?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'Las horas totales deben ser positivas' })
  horasTotales?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'Los aportes totales deben ser positivos' })
  aportesTotales?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'El valor hora debe ser positivo' })
  valorHora?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'La inversión en horas debe ser positiva' })
  inversionHoras?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'La inversión total debe ser positiva' })
  inversionTotal?: number = 0;

  @Type(() => Number)
  @Min(0, { message: 'El porcentaje de participación debe ser positivo' })
  @Max(100, { message: 'El porcentaje de participación no puede exceder 100%' })
  participacionPorc: number;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @MaxLength(1000, { message: 'Las notas no pueden exceder 1000 caracteres' })
  @Transform(({ value }) => value?.trim() || null)
  notas?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  @Type(() => Boolean)
  activo?: boolean = true;
}
