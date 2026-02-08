import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @MaxLength(120)
  code: string;

  @IsString()
  @MaxLength(80)
  resource: string;

  @IsString()
  @MaxLength(80)
  context: string;

  @IsString()
  @MaxLength(80)
  subject: string;

  @IsString()
  @MaxLength(40)
  action: string;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsString()
  @MaxLength(80)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  route?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  dependencies?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
