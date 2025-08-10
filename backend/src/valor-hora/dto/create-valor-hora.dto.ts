import { IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateValorHoraDto {
  @IsNumber()
  @Min(1)
  personaId: number;

  @IsNumber()
  @Min(0)
  valor: number;

  @IsDateString()
  fechaInicio: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
