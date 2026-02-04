import { Body, Controller, Post, Get, Request } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { AuthService } from './auth.service';

// Nota: el prefijo global 'api/v1' ya se aplica en main.ts
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Public()
  register(
    @Body()
    body: {
      email: string;
      password: string;
      nombre: string;
      rol?: string;
      negocioId?: number;
      nombreNegocio?: string;
    },
  ) {
    return this.auth.register(body);
  }

  @Post('login')
  @Public()
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body);
  }

  @Get('me')
  async me(@Request() req: any) {
    return this.auth.getMe(req.user.userId);
  }
}


