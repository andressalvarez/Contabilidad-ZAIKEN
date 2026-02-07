import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsDate,
} from 'class-validator';
import { DateUtils } from '../../common/utils/date.utils';

export class CreateDebtDto {
  @IsOptional()
  @IsInt()
  usuarioId?: number;

  @IsInt()
  @Min(1)
  @Max(960) // 16 hours = 960 minutes
  minutesOwed: number;

  @Type(() => Date)
  @Transform(({ value }) => {
    // Normalize date automatically
    if (value instanceof Date) {
      return DateUtils.normalizeToBusinessDate(value);
    }
    return DateUtils.normalizeToBusinessDate(new Date(value));
  })
  @IsDate()
  date: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}
