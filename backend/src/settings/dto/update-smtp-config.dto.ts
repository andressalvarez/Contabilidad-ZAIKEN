import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEmail,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class SmtpAuthDto {
  @IsString()
  user: string;

  @IsString()
  pass: string;
}

class SmtpFromDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}

export class UpdateSmtpConfigDto {
  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsBoolean()
  @IsOptional()
  secure?: boolean;

  @ValidateNested()
  @Type(() => SmtpAuthDto)
  auth: SmtpAuthDto;

  @ValidateNested()
  @Type(() => SmtpFromDto)
  from: SmtpFromDto;
}
