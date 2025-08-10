import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Conectado a la base de datos PostgreSQL');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Desconectado de la base de datos');
  }

  // Método para limpiar la base de datos en testing
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    const models = Reflect.ownKeys(this).filter(key => key[0] !== '_');

    return Promise.all(
      models.map((modelKey) => this[modelKey].deleteMany())
    );
  }

  // Método para verificar la conexión
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Error de conexión a la base de datos:', error);
      return false;
    }
  }
}
