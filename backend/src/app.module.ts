import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
import { PersonasModule } from './personas/personas.module';
import { TransaccionesModule } from './transacciones/transacciones.module';
import { CategoriasModule } from './categorias/categorias.module';
import { TiposTransaccionModule } from './tipos-transaccion/tipos-transaccion.module';
import { ValorHoraModule } from './valor-hora/valor-hora.module';
import { RegistroHorasModule } from './registro-horas/registro-horas.module';
import { CampanasModule } from './campanas/campanas.module';
import { DistribucionUtilidadesModule } from './distribucion-utilidades/distribucion-utilidades.module';
import { DistribucionDetalleModule } from './distribucion-detalle/distribucion-detalle.module';
import { VSCategoriasModule } from './vs-categorias/vs-categorias.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Módulos del sistema
    PrismaModule,
    RolesModule,
    PersonasModule,
    TransaccionesModule,
    CategoriasModule,
    TiposTransaccionModule,
    ValorHoraModule,
    RegistroHorasModule,
    CampanasModule,
    DistribucionUtilidadesModule,
    DistribucionDetalleModule,
    VSCategoriasModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
