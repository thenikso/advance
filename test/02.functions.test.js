import { describe, testUtils } from './runner/index.mjs';
import { createContext } from '../lib/index.js';

describe('Introduction', async (assert) => {
  const { assertReturn, assertError, assertLogs } = testUtils(
    createContext(),
    assert,
  );

  // TODO more tests on functions and context
});