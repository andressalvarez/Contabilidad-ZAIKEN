import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTipoTransaccionDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
