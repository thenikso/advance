import { describe, testUtils } from './runner/index.mjs';
import { createContext } from '../lib/index.js';

describe('Futures', async (assert) => {
  const { assertReturn } = testUtils(createContext(), assert);

  /**
   * # Futures and Promises
   *
   * Promises are a way to handle asynchronous code in JavaScript.
   * They are a way to represent a value that will be available in the future.
   *
   * Promises are automatically resolved and awaited in the language by default.
   */

  await assertReturn(
    `
    "hello" .timeout 10 |print
    `,
    'hello',
  ).andLogs('hello');

  /**
   * A Future is just a wrapper around a promise that can be used to keep
   * a promise in a context and resolve it later.
   *
   * You can get a Future from a Promise using the future-word modifier `@`.
   * This is a special modifier that can be used in combination with other
   * word modifiers.
   */

  await assertReturn(
    `
    my-future: @timeout "hello" 10
    is-future ?my-future
    `,
    true,
  );
  await assertReturn(
    `
    my-future: "hello" .@timeout 10
    is-future my-future ; '?' is not needed for futures
    `,
    true,
  );

  /**
   * A Future can be awaited using the `await` keyword.
   * The `then` function is also available to modify the result.
   */

  await assertReturn(
    `
    my-future: @timeout "hello" 10
    my-future |then { + "!" } |await
    `,
    'hello!',
  );

  /**
   * You can also use the `promise` word to create a promise from a block.
   * Once again, getting the future from a promise is done with the `@` modifier.
   * Without the `@` modifier the promise would be awaited immediately.
   */

  await assertReturn(
    `
    my-future: @promise {
      "hello" .timeout 10
    }
    my-future |await
    `,
    'hello',
  );
});
