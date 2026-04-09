// test/support/helpers/test-utils.ts
// Common test utilities and helpers

/**
 * Generates a valid UUID v4 for testing.
 */
export function testUuid(suffix = '1'): string {
  return `00000000-0000-4000-a000-${suffix.padStart(12, '0')}`;
}

/**
 * Creates a date relative to now (for testing time-dependent logic).
 *
 * @example
 * const yesterday = relativeDate(-1);
 * const nextWeek = relativeDate(7);
 */
export function relativeDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * Waits for a specified duration (use sparingly in tests).
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strips dynamic fields from an object for snapshot testing.
 * Removes id, createdAt, updatedAt by default.
 */
export function stripDynamicFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[] = ['id', 'createdAt', 'updatedAt'],
): Omit<T, string> {
  const result = { ...obj };
  for (const field of fields) {
    delete result[field];
  }
  return result;
}

/**
 * Assert that an API response matches the standard success format.
 */
export function expectSuccessResponse(body: Record<string, unknown>): void {
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('data');
  expect(body).not.toHaveProperty('error');
}

/**
 * Assert that an API response matches the standard error format.
 */
export function expectErrorResponse(
  body: Record<string, unknown>,
  statusCode?: number,
): void {
  expect(body).toHaveProperty('success', false);
  expect(body).toHaveProperty('error');
  if (statusCode) {
    expect(body).toHaveProperty('statusCode', statusCode);
  }
}
