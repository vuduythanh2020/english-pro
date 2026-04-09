import { createLoggerConfig } from './logger.config';

describe('createLoggerConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should return config with Console transport', () => {
      const config = createLoggerConfig();
      expect(config.transports).toBeDefined();
      expect(Array.isArray(config.transports)).toBe(true);
      expect((config.transports as any[]).length).toBe(1);
    });

    it('should set debug log level', () => {
      const config = createLoggerConfig();
      expect(config.level).toBe('debug');
    });

    it('should include default service name', () => {
      const config = createLoggerConfig();
      expect(config.defaultMeta).toEqual(
        expect.objectContaining({ service: 'english-pro-ai-worker' }),
      );
    });

    it('should use custom service name', () => {
      const config = createLoggerConfig('custom-service');
      expect(config.defaultMeta).toEqual(
        expect.objectContaining({ service: 'custom-service' }),
      );
    });
  });

  describe('production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.GCP_PROJECT_ID = 'test-project';
    });

    it('should set info log level', () => {
      const config = createLoggerConfig();
      expect(config.level).toBe('info');
    });

    it('should have transports configured', () => {
      const config = createLoggerConfig();
      expect(config.transports).toBeDefined();
      expect(Array.isArray(config.transports)).toBe(true);
      expect((config.transports as any[]).length).toBe(1);
    });
  });
});
