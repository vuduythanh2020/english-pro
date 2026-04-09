import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { RequestUser } from '../types/jwt-payload.type';

// Helper to extract the factory function from the decorator metadata
function getParamDecoratorFactory(decorator: Function) {
    class Test {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        public test(@decorator() _value: any) { }
    }

    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
    return args[Object.keys(args)[0]].factory;
}

describe('CurrentUser Decorator', () => {
    const mockUser: RequestUser = {
        sub: 'auth-user-123',
        email: 'parent@example.com',
        role: 'PARENT',
        userId: 'user-uuid-456',
        childId: undefined,
    };

    const createMockContext = (user: RequestUser | undefined): ExecutionContext =>
        ({
            switchToHttp: () => ({
                getRequest: () => ({ user }),
            }),
        }) as unknown as ExecutionContext;

    let factory: (data: any, ctx: ExecutionContext) => any;

    beforeAll(() => {
        factory = getParamDecoratorFactory(CurrentUser);
    });

    it('should return the full user object when no data key is provided', () => {
        const ctx = createMockContext(mockUser);
        const result = factory(undefined, ctx);
        expect(result).toEqual(mockUser);
    });

    it('should return specific field when data key is provided', () => {
        const ctx = createMockContext(mockUser);

        expect(factory('sub', ctx)).toBe('auth-user-123');
        expect(factory('email', ctx)).toBe('parent@example.com');
        expect(factory('role', ctx)).toBe('PARENT');
        expect(factory('userId', ctx)).toBe('user-uuid-456');
    });

    it('should return undefined for childId when user is PARENT', () => {
        const ctx = createMockContext(mockUser);
        expect(factory('childId', ctx)).toBeUndefined();
    });

    it('should return childId for CHILD user', () => {
        const childUser: RequestUser = {
            sub: 'auth-child-789',
            email: undefined,
            role: 'CHILD',
            userId: 'user-uuid-456',
            childId: 'child-uuid-789',
        };
        const ctx = createMockContext(childUser);
        expect(factory('childId', ctx)).toBe('child-uuid-789');
    });

    it('should return undefined when user is not set on request', () => {
        const ctx = createMockContext(undefined);
        const result = factory(undefined, ctx);
        expect(result).toBeUndefined();
    });

    it('should return undefined when accessing a field and user is not set', () => {
        const ctx = createMockContext(undefined);
        const result = factory('email', ctx);
        expect(result).toBeUndefined();
    });
});
