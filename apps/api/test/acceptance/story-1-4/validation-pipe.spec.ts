/**
 * ATDD Tests - Story 1.4: ValidationPipe
 * Test IDs: 1.4-UNIT-021 through 1.4-UNIT-023
 * Priority: P0/P1 (Input Validation)
 * Status: 🔴 RED (failing before implementation)
 *
 * These tests validate that ValidationPipe is configured globally
 * with class-validator + class-transformer and returns clear errors.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const MAIN_TS_PATH = join(__dirname, '../../../src/main.ts');

describe('Story 1.4: ValidationPipe @P0 @Unit', () => {
  // 1.4-UNIT-021: ValidationPipe rejects missing required fields
  describe('1.4-UNIT-021: Missing Required Fields', () => {
    it.skip('should have ValidationPipe configured in main.ts', () => {
      // RED: ValidationPipe not configured yet
      expect(existsSync(MAIN_TS_PATH)).toBe(true);
      const mainContent = readFileSync(MAIN_TS_PATH, 'utf-8');
      expect(mainContent).toContain('ValidationPipe');
      expect(mainContent).toContain('useGlobalPipes');
    });

    it.skip('should reject request with missing required DTO fields', async () => {
      // RED: ValidationPipe + class-validator not configured yet
      // This test verifies the pipe integration with a sample DTO
      const { ValidationPipe } = await import('@nestjs/common');

      // Configure pipe as specified in story
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });

      // Dynamically import class-validator decorators
      // Will fail if class-validator not installed
      const classValidator = await import('class-validator');
      const classTransformer = await import('class-transformer');

      // Define a sample DTO inline for testing
      class SampleDto {
        // These decorators should be available after class-validator is installed
        email!: string;
        password!: string;
      }

      // Apply decorators programmatically
      classValidator.IsEmail()(SampleDto.prototype, 'email');
      classValidator.IsNotEmpty()(SampleDto.prototype, 'email');
      classValidator.MinLength(8)(SampleDto.prototype, 'password');
      classValidator.IsNotEmpty()(SampleDto.prototype, 'password');

      // Test with empty body — should throw BadRequestException
      try {
        await pipe.transform({}, {
          type: 'body',
          metatype: SampleDto,
        } as any);
        fail('Expected ValidationPipe to throw for missing required fields');
      } catch (error: any) {
        expect(error.getStatus()).toBe(400);
        const response = error.getResponse();
        expect(response.message).toBeInstanceOf(Array);
        expect(response.message.length).toBeGreaterThan(0);
      }
    });
  });

  // 1.4-UNIT-022: ValidationPipe rejects non-whitelisted fields
  describe('1.4-UNIT-022: Non-Whitelisted Fields', () => {
    it.skip('should strip or reject non-whitelisted properties', async () => {
      // RED: ValidationPipe + class-validator not configured yet
      const { ValidationPipe, BadRequestException } =
        await import('@nestjs/common');
      const classValidator = await import('class-validator');

      class StrictDto {
        name!: string;
      }
      classValidator.IsNotEmpty()(StrictDto.prototype, 'name');

      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });

      // Send extra property 'hackerField' — should be rejected
      try {
        await pipe.transform({ name: 'Valid Name', hackerField: 'malicious' }, {
          type: 'body',
          metatype: StrictDto,
        } as any);
        fail('Expected ValidationPipe to throw for non-whitelisted field');
      } catch (error: any) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse();
        expect(response.message).toEqual(
          expect.arrayContaining([expect.stringContaining('hackerField')]),
        );
      }
    });
  });

  // 1.4-UNIT-023: ValidationPipe transforms input types
  describe('1.4-UNIT-023: Type Transformation', () => {
    it.skip('should have transform: true and enableImplicitConversion configured', () => {
      // RED: main.ts not updated yet
      expect(existsSync(MAIN_TS_PATH)).toBe(true);
      const mainContent = readFileSync(MAIN_TS_PATH, 'utf-8');

      // Check ValidationPipe options
      expect(mainContent).toContain('whitelist: true');
      expect(mainContent).toContain('forbidNonWhitelisted: true');
      expect(mainContent).toContain('transform: true');
    });

    it.skip('should transform string numbers to actual numbers via implicit conversion', async () => {
      // RED: class-transformer not installed yet
      const { ValidationPipe } = await import('@nestjs/common');
      const classValidator = await import('class-validator');
      const { Type } = await import('class-transformer');

      class PaginationDto {
        page!: number;
        limit!: number;
      }
      classValidator.IsNumber({}, { each: false })(
        PaginationDto.prototype,
        'page',
      );
      classValidator.IsNumber({}, { each: false })(
        PaginationDto.prototype,
        'limit',
      );
      Type(() => Number)(PaginationDto.prototype, 'page');
      Type(() => Number)(PaginationDto.prototype, 'limit');

      const pipe = new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      });

      // Query params come as strings — should be transformed to numbers
      const result = await pipe.transform({ page: '1', limit: '10' }, {
        type: 'query',
        metatype: PaginationDto,
      } as any);

      expect(typeof result.page).toBe('number');
      expect(typeof result.limit).toBe('number');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
});
