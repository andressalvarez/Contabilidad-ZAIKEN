import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateRegistroHorasDto {
  // ✅ usuarioId es el nuevo campo principal
  @IsOptional()
  @IsNumber()
  @Min(1)
  usuarioId?: number;

  // ⚠️ Deprecado - usar usuarioId (mantener para compatibilidad)
  @IsOptional()
  @IsNumber()
  @Min(1)
  personaId?: number;

  @IsOptional()
  @IsNumber()
  campanaId?: number;

  @IsDateString()
  fecha: string;

  @IsNumber()
  @Min(0)
  horas: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
