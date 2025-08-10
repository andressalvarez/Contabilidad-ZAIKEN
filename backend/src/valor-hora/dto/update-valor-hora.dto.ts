import { PartialType } from '@nestjs/mapped-types';
import { CreateValorHoraDto } from './create-valor-hora.dto';

export class UpdateValorHoraDto extends PartialType(CreateValorHoraDto) {}
