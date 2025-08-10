import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateRegistroHorasDto {
  @IsNumber()
  @Min(1)
  personaId: number;

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
