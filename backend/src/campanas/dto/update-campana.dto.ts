import { PartialType } from '@nestjs/mapped-types';
import { CreateCampanaDto } from './create-campana.dto';

export class UpdateCampanaDto extends PartialType(CreateCampanaDto) {}
