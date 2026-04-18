import { Controller, Get } from '@nestjs/common';
import { AiProviderFactory } from '../providers/ai-provider.factory.js';
import { ProviderHealthStatus } from '@english-pro/shared-types';

interface HealthResponse {
    status: 'ok' | 'degraded' | 'error';
    providers: Array<{
        name: string;
        status: ProviderHealthStatus;
    }>;
    timestamp: string;
}

@Controller('health')
export class HealthController {
    constructor(private readonly providerFactory: AiProviderFactory) { }

    @Get()
    async check(): Promise<HealthResponse> {
        const providers = this.providerFactory.getAllProviders();
        const settled = await Promise.allSettled(
            providers.map(async (p) => ({
                name: p.name,
                status: await p.checkHealth(),
            })),
        );
        const results = settled.map((r, i) =>
            r.status === 'fulfilled'
                ? r.value
                : { name: providers[i].name, status: 'unavailable' as const },
        );

        const hasUnavailable = results.some((r) => r.status === 'unavailable');
        const hasDegraded = results.some((r) => r.status === 'degraded');

        return {
            status: hasUnavailable ? 'error' : hasDegraded ? 'degraded' : 'ok',
            providers: results,
            timestamp: new Date().toISOString(),
        };
    }
}
