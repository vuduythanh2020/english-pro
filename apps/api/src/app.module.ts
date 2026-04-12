import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConsentModule } from './modules/consent/consent.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createLoggerConfig } from './config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ⚠️ IMPORTANT: WinstonModule MUST be imported BEFORE CommonModule.
    // CommonModule's LoggingInterceptor depends on WINSTON_MODULE_PROVIDER
    // which is registered by WinstonModule. Changing this order will cause
    // a DI resolution error at runtime.
    WinstonModule.forRoot(createLoggerConfig()),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 60 }]),
    PrismaModule,
    CommonModule,
    AuthModule,
    ConsentModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
