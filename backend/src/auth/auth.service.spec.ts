import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { SecurityEventType } from '../security/audit/audit.service';

describe('AuthService audit logging', () => {
  const prisma = {
    usuario: {
      findUnique: jest.fn(),
    },
  } as any;
  const jwt = {
    sign: jest.fn().mockReturnValue('token'),
  } as any;
  const auditService = {
    log: jest.fn().mockResolvedValue({}),
  } as any;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwt, auditService);
  });

  it('logs login success', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 1,
      email: 'admin@test.local',
      password: 'hash',
      activo: true,
      negocioId: 10,
      negocio: { id: 10, activo: true, nombre: 'Negocio' },
      securityRole: { id: 2, name: 'Administrador' },
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);

    await service.login(
      { email: 'admin@test.local', password: 'Secret123!' },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: SecurityEventType.LOGIN,
        userId: 1,
        negocioId: 10,
      }),
    );
  });

  it('logs login failure on bad password', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 2,
      email: 'user@test.local',
      password: 'hash',
      activo: true,
      negocioId: 20,
      negocio: { id: 20, activo: true, nombre: 'Negocio' },
      securityRole: { id: 3, name: 'Usuario' },
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as any);

    await expect(
      service.login(
        { email: 'user@test.local', password: 'Wrong!' },
        { ipAddress: '127.0.0.1', userAgent: 'jest' },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: SecurityEventType.LOGIN_FAILED,
        userId: 2,
        negocioId: 20,
      }),
    );
  });
});
