import { describe, testUtils } from './runner/index.mjs';
import { createContext } from '../lib/index.js';

describe('Introduction', async (assert) => {
  const { assertReturn, assertError, assertLogs } = testUtils(
    createContext(),
    assert,
  );

  /**
   * # Introduction
   *
   * An expression in this language is a series of values separated by
   * whitespaces. The last value is the result of the expression.
   */

  assertReturn(`1 2 3`, 3);

  /**
   * # Values
   *
   * Besides numbers, the language also supports other types of values.
   */

  assertReturn(`"Hello, World!"`, 'Hello, World!');
  assertReturn(`true`, true);
  // TODO Url, Email, File

  /**
   * # Comments
   *
   * Comments are ignored by the parser and can be used to document the code.
   * They start with the `;` character and go until the end of the line.
   */

  assertReturn(`; this is a comment`, undefined);

  /**
   * # Words
   *
   * Another important value is the `word`. Words are used to reference
   * functions and variables.
   *
   * A `word` must start with a letter or an hash `#` character and can
   * contain (almost) any other character except whitespaces after that.
   *
   *     word       ; this is a valid word
   *     a-word     ; also valid
   *     #+         ; this is the word for the + operator (infix, see later)
   *     -not-valid ; this is not a valid word
   */

  assertError('word', 'word not found { (here) word }');
  assertReturn(`'print ; we will see the meaning of ' later`, Symbol.for('print'));

  /**
   * If a `word` is associated with a value, that value is returned.
   * If otherwise it is associated with a function, the function is called.
   * There is no need to use parentheses to call a function.
   * However for a function to be called, all its arguments must be provided.
   */

  assertError(`print`, 'expected value { print (here) }');

  /**
   * But when a function is called with all its arguments, it is executed.
   */

  assertLogs(`print "Hello, World!"`, ['Hello, World!']);

  /**
   * A function's return value is just like any other value in the expression
   * and can be used right after it's been produced.
   */

  assertReturn(`print inc 10`, 11).andLogs('11');

  /**
   * The `print` function requires one parameter, but the `inc` function requires
   * one as well. Therefore `print` waits for a value to be produced before it
   * is called. After `inc` produces a value, `print` is called with that value.
   *
   * Another example:
   */

  assertReturn(`print 41 |inc`, 42).andLogs('41');

  /**
   * Above, the `print` function is called with the argument `41` and then
   * the result is passed to the `inc` function.
   *
   * Notice that the `|` character is used before the `inc` function.
   *
   * This is the first kind of `word` variation.
   */

  /**
   * ### Pipe words
   *
   * A pipe word is a `word` that is prefixed with the `|` character.
   * The expression is evaluated from left to right untill the pipe word
   * is reached. Then the result of the expression is passed as the first
   * argument to the function associated with the pipe word.
   */

  assertReturn(`2 + 3 |inc`, 6);
  assertLogs(`2 + 3 |print`, ['5']);
  assertError(
    `2 + |print`,
    'cannot pipe an incomplete expression { 2 + (here) |print }',
  );

  /**
   * Pipes and other words modifiers works also on operators.
   * In fact the math operators preferences are not what you might expect.
   * There are no parentheses to change the order of operations.
   * Instead, you can use pipe words.
   */

  assertReturn(`2 + 3 * 2`, 8);
  assertReturn(`2 + 3 |* 2`, 10);

  /**
   * ### Op words
   *
   * Op words (or operators) are `word`s that are prefixed with the `.` character.
   * They are similar to pipe words but they take the value on the left as the
   * first argument and the values on the right as the other arguments (if any).
   */

  assertReturn(`2 + 3 .print`, 5).andLogs('3');

  /**
   * Note that Op words take precedence over other words.
   * In the following, the `print` function is called with the result of `2 .inc`
   * and not `2` as it would be the case for `print 2 |inc`.
   */

  assertLogs(`print 2 .inc`, ['3']);

  /**
   * Operators such as `+` are op words.
   * Those are in fact defined with a special character `#` that makes them
   * op words by default.
   *
   * The regular `word` for the `+` operator is actually `#+`.
   *
   * We will see how to define new infix operators like that later.
   */

  assertReturn(`#+ 2 3`, 5);

  /**
   * ### Set words
   *
   * Set words are words that are followed by the `:` character.
   * They are used to define variables.
   */

  assertReturn(`a: 42`, 42);

  /**
   * The value immediatelly following a set word is used as the value.
   * This means that functions are resolved untill a value is found.
   * After that, the expression continues as usual.
   */

  assertReturn(`a: 1 + 1 print a |inc`, 3).andLogs('2');

  /**
   * ### Lset words
   *
   * Lset words are words that are prefixed with the `:` character.
   * This act like Pipe words in waiting for all the expression before them
   * to be evaluated. After that the value is assigned to the word.
   */

  assertReturn(`inc 3 :a print a`, 4).andLogs('4');

  /**
   * With both set and lset words, attemptint to set them to an incomplete
   * expression will result in an error.
   */

  assertError(`a: 1 +`, 'expected value { a: 1 + (here) }');
  assertError(
    `print :my-print`,
    'cannot set an incomplete expression { print (here) :my-print }',
  );

  /**
   * ### Get words
   *
   * Get words are words that are prefixed with the `?` character.
   * Given that functions are executed immediately, it might be needed sometimes
   * to get the function itself and not its result.
   */

  assertReturn(`?print`, (print) => typeof print === 'function');

  /**
   * ### Lit words
   *
   * Lit words are words that are prefixed with the `'` character.
   * These are needed when you want the literal word and not its value.
   */

  assertReturn(`'print`, Symbol.for('print'));

  /**
   * ## Blocks
   *
   * A block is an expression that is enclosed in curly braces `{ }`.
   */

  assertLogs(`print { 1 + 1 }`, ['{ 1 + 1 }']);

  /**
   * Blocks are both data but also executable code.
   * A way to execute a block is with the `do` function.
   */

  assertLogs(`print do { 1 + 1 }`, ['2']);

  /**
   * Other functions may use them as data. Like `join` that
   * connects strings together.
   */

  assertReturn(`join { "Hello," " " "World!" }`, 'Hello, World!');

  /**
   * Blocks can be saved and passed around to be executed later.
   */

  assertReturn(`myBlock: { 1 + 1 } do myBlock`, 2);

  /**
   * And they can be converted to just data with, for example,
   * the `list` or `dict` function.
   */

  assertReturn(`list { 1 1 + 1 inc 2 }`, [1, 2, 3]);
  assertReturn(
    `dict { a: 1 b: 1 + 1 }`,
    new Map([
      ['a', 1],
      ['b', 2],
    ]),
  );

  /**
   * ### Commas
   *
   * Commas can be used to separate values in a block.
   */

  assertReturn(`do { 1 , 2 , 3 }`, 3);

  /**
   * They can be used for visual clarity instead of just spaces.
   * But they also serve a purpose when used in a block that is executed.
   * Take for example the `with` function. It takes a value and a block,
   * executing the block with the value injected in it. Like so:
   */

  assertReturn(`40 .with { + 2 }`, 42);

  /**
   * The `+` operator expects a value on the left and a value on the right.
   * The value on the left is provided by the `with` function.
   *
   * With a comma `,` one can "reset" the current value as if it was the
   * first value in the block.
   */

  assertReturn(`40 .with { .inc |print , + 2 }`, 42).andLogs('41');
});
