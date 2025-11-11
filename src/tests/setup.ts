import { beforeAll, afterAll } from 'vitest';

// Setup runs before all tests
beforeAll(() => {
  console.log('Test environment initialized');
});

// Cleanup runs after all tests
afterAll(() => {
  console.log('Test environment cleanup complete');
});
