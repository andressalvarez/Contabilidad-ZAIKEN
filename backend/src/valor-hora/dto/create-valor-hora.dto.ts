import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateValorHoraDto {
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

  @IsNumber()
  @Min(0)
  valor: number;

  @IsDateString()
  fechaInicio: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
