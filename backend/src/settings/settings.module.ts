import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [PrismaModule, EmailModule, CaslModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
