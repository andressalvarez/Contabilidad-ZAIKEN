import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { CaslModule } from '../casl/casl.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [PrismaModule, EmailModule, CaslModule, SecurityModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
