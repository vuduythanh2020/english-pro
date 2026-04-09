// test/support/factories/parent.factory.ts
// Factory for Parent test data with faker-like defaults

let counter = 0;

function nextId(): string {
    counter++;
    return `00000000-0000-4000-a000-${String(counter).padStart(12, '0')}`;
}

export interface ParentFactoryInput {
    id?: string;
    authUserId?: string;
    email?: string;
    role?: 'PARENT';
    displayName?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Creates a Parent object with sensible defaults.
 * Override any field via the input parameter.
 *
 * @example
 * const parent = parentFactory(); // all defaults
 * const custom = parentFactory({ email: 'custom@test.com', isActive: false });
 */
export function parentFactory(input?: ParentFactoryInput) {
    const id = input?.id ?? nextId();
    const now = new Date();

    return {
        id,
        authUserId: input?.authUserId ?? nextId(),
        email: input?.email ?? `parent-${id.slice(-4)}@test.com`,
        role: input?.role ?? 'PARENT',
        displayName: input?.displayName ?? `Test Parent ${id.slice(-4)}`,
        isActive: input?.isActive ?? true,
        createdAt: input?.createdAt ?? now,
        updatedAt: input?.updatedAt ?? now,
    };
}

/**
 * Creates multiple Parent objects.
 */
export function parentFactoryMany(
    count: number,
    overrides?: ParentFactoryInput,
) {
    return Array.from({ length: count }, () => parentFactory(overrides));
}

/**
 * Reset the counter (call in beforeEach for deterministic IDs).
 */
export function resetParentFactory(): void {
    counter = 0;
}
