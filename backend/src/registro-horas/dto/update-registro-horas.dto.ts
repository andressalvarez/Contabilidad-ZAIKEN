import { PartialType } from '@nestjs/mapped-types';
import { CreateRegistroHorasDto } from './create-registro-horas.dto';

export class UpdateRegistroHorasDto extends PartialType(CreateRegistroHorasDto) {}
