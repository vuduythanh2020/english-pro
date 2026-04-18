import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module.js';
import { HealthController } from './health.controller.js';

@Module({
    imports: [ProvidersModule],
    controllers: [HealthController],
})
export class HealthModule { }
