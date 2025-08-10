import { PartialType } from '@nestjs/mapped-types';
import { CreateDistribucionUtilidadesDto } from './create-distribucion-utilidades.dto';

export class UpdateDistribucionUtilidadesDto extends PartialType(CreateDistribucionUtilidadesDto) {}
