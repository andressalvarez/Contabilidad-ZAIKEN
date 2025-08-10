import { IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateDistribucionUtilidadesDto {
  @IsString()
  periodo: string;

  @IsDateString()
  fecha: string;

  @IsNumber()
  utilidadTotal: number;

  @IsString()
  @IsOptional()
  estado?: string;
}
