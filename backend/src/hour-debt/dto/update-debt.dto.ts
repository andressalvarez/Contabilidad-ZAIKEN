import { IsInt, IsString, IsNotEmpty, Min, IsOptional } from 'class-validator';

export class UpdateDebtDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  minutesOwed?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  remainingMinutes?: number;

  @IsString()
  @IsNotEmpty()
  adminReason: string; // MANDATORY for audit trail
}
