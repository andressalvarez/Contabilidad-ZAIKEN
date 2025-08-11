import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { AuthService } from './auth.service';

// Nota: el prefijo global 'api/v1' ya se aplica en main.ts
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Public()
  register(@Body() body: { email: string; password: string; nombre: string }) {
    return this.auth.register(body);
  }

  @Post('login')
  @Public()
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body);
  }
}


