import { Body, Controller, Post, Get, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';

// Nota: el prefijo global 'api/v1' ya se aplica en main.ts
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private usuariosService: UsuariosService,
  ) {}

  @Post('register')
  @Public()
  register(
    @Body()
    body: {
      email: string;
      password: string;
      nombre: string;
      securityRoleId?: number;
      negocioId?: number;
      nombreNegocio?: string;
    },
  ) {
    return this.auth.register(body);
  }

  @Post('login')
  @Public()
  login(@Body() body: { email: string; password: string }, @Request() req: any) {
    const ipAddress =
      req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress;
    const userAgent = req?.headers?.['user-agent'];
    return this.auth.login(body, { ipAddress, userAgent });
  }

  @Get('me')
  async me(@Request() req: any) {
    return this.auth.getMe(req.user.userId);
  }

  /**
   * Request password reset (public - user enters their email)
   */
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    const result = await this.usuariosService.requestPasswordReset(body.email);
    return {
      success: true,
      message: result.message,
    };
  }

  /**
   * Reset password with token (public - user clicks link from email)
   */
  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    const result = await this.usuariosService.resetPassword(body.token, body.password);
    return {
      success: true,
      message: result.message,
    };
  }
}
