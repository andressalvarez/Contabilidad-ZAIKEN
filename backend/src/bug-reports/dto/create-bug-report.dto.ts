import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBugReportDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsUrl({ require_protocol: true }, { message: 'La URL de evidencia no es valida' })
  @MaxLength(500)
  @IsNotEmpty()
  evidenceUrl: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true }, { message: 'La URL del modulo no es valida' })
  @MaxLength(2000)
  moduleUrl?: string;
}
