import { IsNumber } from 'class-validator';

export class CreateDistribucionDetalleDto {
  @IsNumber()
  distribucionId: number;

  @IsNumber()
  personaId: number;

  @IsNumber()
  porcentajeParticipacion: number;

  @IsNumber()
  montoDistribuido: number;
}
