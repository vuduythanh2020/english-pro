// test/support/jest-setup.ts
// Global Jest setup for all test types

// Increase timeout for integration/e2e tests
jest.setTimeout(30_000);

// Suppress console.log in tests (uncomment if needed)
// global.console.log = jest.fn();

// Add custom matchers if needed
// expect.extend({ ... });
