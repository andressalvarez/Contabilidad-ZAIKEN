import { PartialType } from '@nestjs/mapped-types';
import { CreateDistribucionDetalleDto } from './create-distribucion-detalle.dto';

export class UpdateDistribucionDetalleDto extends PartialType(CreateDistribucionDetalleDto) {}
