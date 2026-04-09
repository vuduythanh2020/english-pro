// test/support/factories/child-profile.factory.ts
// Factory for ChildProfile test data

let counter = 0;

function nextId(): string {
  counter++;
  return `00000000-0000-4000-b000-${String(counter).padStart(12, '0')}`;
}

export interface ChildProfileFactoryInput {
  id?: string;
  parentId?: string;
  displayName?: string;
  avatarId?: number;
  age?: number | null;
  level?: string;
  xpTotal?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastActiveDate?: Date | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a ChildProfile object with sensible defaults.
 *
 * @example
 * const child = childProfileFactory({ parentId: 'parent-uuid' });
 * const beginner = childProfileFactory({ level: 'beginner', age: 5 });
 */
export function childProfileFactory(input?: ChildProfileFactoryInput) {
  const id = input?.id ?? nextId();
  const now = new Date();

  return {
    id,
    parentId: input?.parentId ?? '00000000-0000-4000-a000-000000000001',
    displayName: input?.displayName ?? `Kid ${id.slice(-4)}`,
    avatarId: input?.avatarId ?? 1,
    age: input?.age ?? 6,
    level: input?.level ?? 'beginner',
    xpTotal: input?.xpTotal ?? 0,
    currentStreak: input?.currentStreak ?? 0,
    longestStreak: input?.longestStreak ?? 0,
    lastActiveDate: input?.lastActiveDate ?? null,
    isActive: input?.isActive ?? true,
    createdAt: input?.createdAt ?? now,
    updatedAt: input?.updatedAt ?? now,
  };
}

/**
 * Creates multiple ChildProfile objects.
 */
export function childProfileFactoryMany(
  count: number,
  overrides?: ChildProfileFactoryInput,
) {
  return Array.from({ length: count }, () => childProfileFactory(overrides));
}

export function resetChildProfileFactory(): void {
  counter = 0;
}
