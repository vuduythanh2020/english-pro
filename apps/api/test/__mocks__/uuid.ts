/**
 * Manual mock for 'uuid' ESM module.
 * uuid v13 is ESM-only, which causes issues with Jest + ts-jest in pnpm monorepos.
 * This CJS-compatible mock provides deterministic UUIDs for testing.
 */

let counter = 0;

export function v4(): string {
  counter++;
  const hex = counter.toString(16).padStart(12, '0');
  return `00000000-0000-4000-a000-${hex}`;
}

export function v1(): string {
  return v4();
}

// Reset counter between test suites
export function __resetCounter(): void {
  counter = 0;
}

export default { v4, v1 };
