import { IsNumber, IsString, IsOptional, IsDateString, Min, ValidateIf } from 'class-validator';

export class CreateRegistroHorasDto {
  @IsNumber()
  @Min(1)
  usuarioId: number;

  @IsOptional()
  @IsNumber()
  campanaId?: number;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsDateString()
  timerInicio?: string;

  @IsOptional()
  @IsDateString()
  timerFin?: string;

  @IsOptional()
  @IsString()
  origen?: string;

  @ValidateIf((o) => !o.timerInicio || !o.timerFin)
  @IsNumber()
  @Min(0)
  horas?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
