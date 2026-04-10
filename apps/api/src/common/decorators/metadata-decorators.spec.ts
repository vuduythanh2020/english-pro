import 'reflect-metadata';
import { PARENT_ONLY_KEY, ParentOnly } from './parent-only.decorator';
import { IS_PUBLIC_KEY, Public } from './public.decorator';
import { ROLES_KEY, Roles } from './roles.decorator';

/**
 * Tests for SetMetadata-based decorators.
 *
 * These decorators are simple wrappers around NestJS SetMetadata.
 * We verify:
 *   1. The metadata key is correctly exported
 *   2. The decorator sets the correct metadata value
 *   3. Multiple roles are set correctly (Roles decorator)
 */
describe('Metadata Decorators', () => {
  // Helper: apply a class decorator and read the metadata it sets
  function getClassMetadata(decorator: ClassDecorator, key: string) {
    @decorator
    class TestTarget {}
    return Reflect.getMetadata(key, TestTarget);
  }

  describe('ParentOnly', () => {
    it('should export the correct metadata key', () => {
      expect(PARENT_ONLY_KEY).toBe('parentOnly');
    });

    it('should set parentOnly metadata to true', () => {
      const value = getClassMetadata(ParentOnly(), PARENT_ONLY_KEY);
      expect(value).toBe(true);
    });
  });

  describe('Public', () => {
    it('should export the correct metadata key', () => {
      expect(IS_PUBLIC_KEY).toBe('isPublic');
    });

    it('should set isPublic metadata to true', () => {
      const value = getClassMetadata(Public(), IS_PUBLIC_KEY);
      expect(value).toBe(true);
    });
  });

  describe('Roles', () => {
    it('should export the correct metadata key', () => {
      expect(ROLES_KEY).toBe('roles');
    });

    it('should set single role metadata', () => {
      const value = getClassMetadata(Roles('PARENT'), ROLES_KEY);
      expect(value).toEqual(['PARENT']);
    });

    it('should set multiple roles metadata', () => {
      const value = getClassMetadata(Roles('PARENT', 'CHILD'), ROLES_KEY);
      expect(value).toEqual(['PARENT', 'CHILD']);
    });

    it('should set empty roles array when no roles provided', () => {
      const value = getClassMetadata(Roles(), ROLES_KEY);
      expect(value).toEqual([]);
    });
  });
});
