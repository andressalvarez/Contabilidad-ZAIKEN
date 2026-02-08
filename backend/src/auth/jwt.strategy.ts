import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change_this_secret_in_env',
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
    negocioId: number;
    securityRoleId: number;
    securityRoleName?: string;
    negocioRoleName?: string;
  }) {
    return {
      userId: payload.sub,
      email: payload.email,
      negocioId: payload.negocioId,
      securityRoleId: payload.securityRoleId,
      securityRoleName: payload.securityRoleName,
      negocioRoleName: payload.negocioRoleName,
    };
  }
}

