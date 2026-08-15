import { it, expect } from 'vitest';
it('diag', () => {
  expect(true).toBe(true);
  // eslint-disable-next-line no-console
  console.log('window.localStorage =', typeof window.localStorage);
  console.log('globalThis.localStorage =', typeof globalThis.localStorage);
});
