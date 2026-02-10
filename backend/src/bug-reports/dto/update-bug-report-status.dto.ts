import { BugReportStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateBugReportStatusDto {
  @IsEnum(BugReportStatus)
  status: BugReportStatus;
}
