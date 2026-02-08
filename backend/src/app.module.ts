import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RolesModule } from './roles/roles.module';
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
import { RolesGuard } from './auth/roles.guard';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CaslModule } from './casl/casl.module';
import { EmailModule } from './email/email.module';
import { SettingsModule } from './settings/settings.module';
import { HourDebtModule } from './hour-debt/hour-debt.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Módulos del sistema
    PrismaModule,
    CaslModule,
    RolesModule,
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
    UsuariosModule,
    EmailModule,
    SettingsModule,
    HourDebtModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
