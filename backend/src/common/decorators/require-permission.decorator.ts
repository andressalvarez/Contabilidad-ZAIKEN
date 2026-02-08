import { SetMetadata } from '@nestjs/common';

export const PERMISSION_CODES_KEY = 'permission_codes';

export const RequirePermission = (...codes: string[]) => SetMetadata(PERMISSION_CODES_KEY, codes);
