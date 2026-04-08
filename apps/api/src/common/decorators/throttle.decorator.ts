import { Throttle } from '@nestjs/throttler';

// AI endpoints: 10 req/min per child
export const AiRateLimit = () =>
  Throttle({ default: { ttl: 60000, limit: 10 } });

// Auth endpoints: 5 attempts/min
export const AuthRateLimit = () =>
  Throttle({ default: { ttl: 60000, limit: 5 } });
