import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from './config/logger.config';
import { redisConfig } from './config/redis.config';
import { aiProvidersConfig } from './config/ai-providers.config';
import { PipelineModule } from './pipeline/pipeline.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [redisConfig, aiProvidersConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    WinstonModule.forRoot(createLoggerConfig()),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string | undefined>('redis.password'),
          db: config.get<number>('redis.db', 0),
        },
      }),
    }),
    PipelineModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class WorkerModule { }
