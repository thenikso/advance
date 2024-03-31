import { describe, testUtils } from './runner/index.mjs';
import { createContext } from '../lib/index.js';

describe('Introduction', async (assert) => {
  const { assertReturn, assertError, assertLogs } = testUtils(
    createContext(),
    assert,
  );

  /**
   * # Functions and Context
   *
   * Functions can be defined using the `fn` keyword.
   * It expects a list of arguments and a body block.
   */

  assertReturn(`add: fn { a b } { a + b }`, (v) => typeof v === 'function');

  /**
   * If there are no arguments you can either use an empty block like
   * `fn { } { print "something" }` or use the `does` keyword.
   */

  assertReturn(
    `sai-hi: does { print "Hi!" }
    sai-hi`,
    'Hi!',
  ).andLogs('Hi!');

  /**
   * A function is executed in the context it is called in.
   */

  assertReturn(
    `name: "John"
    say-name: fn { } { print name }
    say-name`,
    'John',
  );

  /**
   * A context can be created with the `context` function.
   */

  assertLogs(
    `say-name: fn { } { print name }
    context {
      name: "Alice"
      say-name
    }
    context {
      name: "John"
      say-name
    }`,
    ['Alice', 'John'],
  );

  /**
   * ## Capturing variables
   *
   * Sometimes you want to capture a variable from the context where the function
   * is defined. You can do this using a lit-word in the function arguments.
   */

  assertReturn(
    `greeter: context {
      greeting: "Hello "
      say-hi: fn { name 'greeting } { greeting + name + suffix }
    }
    suffix: "!"
    greeter/say-hi "Alice"`,
    'Hello Alice!',
  );

  /**
   * ## Calling in a different context
   *
   * Functiona are generally automatically called when being used.
   * If you get one with a get-word, you can still call it with `call`.
   */

  assertReturn(
    `say-hi: fn { name } { print "Hi " + name }
    ?say-hi |call [ "Alice" ]`,
    'Hi Alice',
  );

  /**
   * And a function can be called with a different context using `call-in`.
   */

  assertReturn(
    `say-hi: fn { name } { print greeting + name }
    with-greeting: context { greeting: "Hello " }
    ?say-hi |call-in with-greeting [ "Alice" ]`,
    'Hello Alice',
  );

  /**
   * ## Getting the context
   *
   * The current or parent context can be accessed with the `context-current`
   * and `context-parent` functions.
   *
   * The `do-in` function can be used to execute a block in a different context.
   */

  assertReturn(
    `ctx-a: context {
      a: 1
    }
    do-in ctx-a {
      context-current |= context-parent .get 'ctx-a
    }`,
    true,
  );
});
