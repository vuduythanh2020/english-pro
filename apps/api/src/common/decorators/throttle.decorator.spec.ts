import { AiRateLimit, AuthRateLimit } from './throttle.decorator';
import { Throttle } from '@nestjs/throttler';

/**
 * Tests for rate-limiting decorator wrappers.
 *
 * These are convenience aliases around @nestjs/throttler's Throttle.
 * We verify the correct TTL and limit values are configured.
 */
describe('Throttle Decorators', () => {
  // Throttle stores config via Reflect.defineMetadata with the THROTTLER_LIMIT and THROTTLER_TTL keys.
  // We compare the decorator output by applying them to test classes and reading metadata.

  function getThrottlerMetadata(decorator: ClassDecorator) {
    @decorator
    class TestTarget {}
    // NestJS throttler stores under 'THROTTLER:MODULE_OPTIONS' or the throttler metadata key
    const allKeys = Reflect.getMetadataKeys(TestTarget);
    const metadata: Record<string, unknown> = {};
    for (const key of allKeys) {
      metadata[key] = Reflect.getMetadata(key, TestTarget);
    }
    return metadata;
  }

  describe('AiRateLimit', () => {
    it('should apply throttle metadata to the target', () => {
      const metadata = getThrottlerMetadata(AiRateLimit());
      // The decorator should set some metadata keys
      expect(Object.keys(metadata).length).toBeGreaterThan(0);
    });

    it('should have throttle metadata matching Throttle({default: {ttl: 60000, limit: 10}})', () => {
      // Apply both decorators and verify they produce the same metadata
      const aiMetadata = getThrottlerMetadata(AiRateLimit());
      const directMetadata = getThrottlerMetadata(
        Throttle({ default: { ttl: 60000, limit: 10 } }),
      );
      expect(aiMetadata).toEqual(directMetadata);
    });
  });

  describe('AuthRateLimit', () => {
    it('should apply throttle metadata to the target', () => {
      const metadata = getThrottlerMetadata(AuthRateLimit());
      expect(Object.keys(metadata).length).toBeGreaterThan(0);
    });

    it('should have throttle metadata matching Throttle({default: {ttl: 60000, limit: 5}})', () => {
      const authMetadata = getThrottlerMetadata(AuthRateLimit());
      const directMetadata = getThrottlerMetadata(
        Throttle({ default: { ttl: 60000, limit: 5 } }),
      );
      expect(authMetadata).toEqual(directMetadata);
    });

    it('should differ from AiRateLimit (different limits)', () => {
      const aiMetadata = getThrottlerMetadata(AiRateLimit());
      const authMetadata = getThrottlerMetadata(AuthRateLimit());
      // They should not be equal because limits differ (10 vs 5)
      expect(aiMetadata).not.toEqual(authMetadata);
    });
  });
});
