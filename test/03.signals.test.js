import { describe, testUtils } from './runner/index.mjs';
import { createContext } from '../lib/index.js';

describe('Signals', async (assert) => {
  const { assertReturn, assertLogs } = testUtils(createContext(), assert);

  /**
   * # Signals
   *
   * Signals are a way to listen and propagate changes reactively.
   * They are integrated into the language so that you can use them
   * as regular variables.
   */

  assertReturn(
    `
    a: signal "Hello"
    print a
    a: "World"
    a
    `,
    'World',
  ).andLogs('Hello');

  /**
   * To inspect a signal you can use the get-word `?`.
   * Also, you can call `value` and `setValue` on a signal if needed.
   */

  assertReturn(`a: signal "Hello" , is-signal ?a`, true);
  assertReturn(
    `
    a: signal "Hello"
    a/setValue "World" ; equivalent to 'a: "World"'
    a/value ; equivalent to print 'a'
    `,
    'World',
  );

  /**
   * ## Watchers
   *
   * To listen to changes in a signal you can use the `watch` keyword.
   * It expects a block with the code to execute. Any signal used inside
   * will trigger the block again when it changes.
   */

  assertLogs(
    `
    a: signal "Hello"
    watch { print a }
    a: "World"
    `,
    ['Hello', 'World'],
  );

  /**
   * They also return their value but can be inspected with the get-word `?`.
   */

  assertReturn(
    `
    a: signal "Hello"
    w: watch { a + "!" }
    print w
    is-watch ?w
    `,
    true,
  ).andLogs('Hello!');

  /**
   * Watchers themselves are signals, so you can use them to create
   * more complex behaviors.
   */

  assertLogs(
    `
    name: signal "you"
    greet: watch { print "Hello " + name }
    final: watch { print greet + "!" }
    name: "World"
    `,
    ['Hello you', 'Hello you!', 'Hello World', 'Hello World!'],
  );

  /**
   * A watcher can be stopped by calling `stop` on it.
   * This will remove it from the list of watchers of the signals it uses.
   */

  assertLogs(
    `
    a: signal "Hello"
    w: watch { print a }
    a: "World"
    w/stop
    a: "Again"
    `,
    ['Hello', 'World'],
  );
});
