import { IsString, IsDateString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateCampanaDto {
  @IsString()
  nombre: string;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsNumber()
  @IsOptional()
  presupuesto?: number;

  @IsNumber()
  @IsOptional()
  objetivoIngresos?: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
