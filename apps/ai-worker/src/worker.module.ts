import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from './config/logger.config';

@Module({
  imports: [WinstonModule.forRoot(createLoggerConfig())],
  controllers: [],
  providers: [],
})
export class WorkerModule {}
