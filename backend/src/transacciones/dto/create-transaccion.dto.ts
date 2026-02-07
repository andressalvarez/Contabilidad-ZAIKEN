import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString, Min, MaxLength, IsBoolean, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateTransaccionDto {
  @IsInt({ message: 'El ID del tipo de transacción debe ser un número entero' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  tipoId: number;

  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @Min(0, { message: 'El monto debe ser positivo' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  monto: number;

  @IsString({ message: 'El concepto debe ser un texto' })
  @IsNotEmpty({ message: 'El concepto es obligatorio' })
  @MaxLength(500, { message: 'El concepto no puede exceder 500 caracteres' })
  @Transform(({ value }) => value?.trim())
  concepto: string;

  @IsDateString({}, { message: 'La fecha debe tener formato válido (YYYY-MM-DD)' })
  fecha: string;

  @IsOptional()
  @IsInt({ message: 'El ID de la categoría debe ser un número entero' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  categoriaId?: number;

  @IsOptional()
  @IsInt({ message: 'El ID de usuario debe ser un número entero' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  usuarioId?: number;

  @IsOptional()
  @IsInt({ message: 'El ID de campaña debe ser un número entero' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  campanaId?: number;

  @IsOptional()
  @IsString({ message: 'El comprobante debe ser un texto' })
  @MaxLength(255, { message: 'La URL del comprobante no puede exceder 255 caracteres' })
  @Transform(({ value }) => value?.trim() || null)
  comprobante?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado de aprobación debe ser verdadero o falso' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return Boolean(value);
  })
  aprobado?: boolean = false;

  @IsOptional()
  @IsString({ message: 'La moneda debe ser un texto' })
  @Transform(({ value }) => value?.trim() || 'COP')
  moneda?: string = 'COP';

  @IsOptional()
  @IsString({ message: 'Las notas deben ser un texto' })
  @MaxLength(1000, { message: 'Las notas no pueden exceder 1000 caracteres' })
  @Transform(({ value }) => value?.trim() || null)
  notas?: string;
}
