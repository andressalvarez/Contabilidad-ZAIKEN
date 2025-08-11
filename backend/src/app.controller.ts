import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  async getHealth() {
    const dbHealthy = await this.prisma.isHealthy();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('info')
  getInfo() {
    return {
      name: 'Sistema Zaiken API',
      description: 'API para gestión integral de recursos, personas y transacciones',
      version: '1.0.0',
      endpoints: {
        roles: '/api/v1/roles',
        personas: '/api/v1/personas',
        transacciones: '/api/v1/transacciones',
        health: '/api/v1/health',
      },
    };
  }
}
