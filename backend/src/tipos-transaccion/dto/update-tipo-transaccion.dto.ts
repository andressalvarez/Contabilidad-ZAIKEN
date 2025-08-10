import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoTransaccionDto } from './create-tipo-transaccion.dto';

export class UpdateTipoTransaccionDto extends PartialType(CreateTipoTransaccionDto) {}
