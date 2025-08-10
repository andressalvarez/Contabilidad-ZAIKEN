import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: true, // Permitir todos los orígenes en desarrollo
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Configurar validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 422,
    }),
  );

  // Prefijo global para las APIs
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3004;
  await app.listen(port);

  console.log(`🚀 Servidor NestJS ejecutándose en http://localhost:${port}`);
  console.log(`📖 API documentación: http://localhost:${port}/api/v1`);
}

bootstrap().catch((error) => {
  console.error('❌ Error iniciando la aplicación:', error);
  process.exit(1);
});
