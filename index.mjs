// @ts-check

import { run, parse, createContext } from './lib/index.js';

export { createContext } from './lib/index.js';

/**
 * Parse and run the given code in the optional context (or creates a new one)
 * @param {string} code The code to run
 * @param {Object=} context The context to run the code in
 * @returns {any} The result of the code execution
 */
export function exec(code, context) {
  return run(parse(code), context || createContext());
}

/**
 * Parse and run the given code. This is a tagged template literal.
 * @example
 * const result = adv`1 + 2`;
 * @param {string[]} strings
 * @param  {...any} values
 * @returns {any} The result of the code execution
 */
export function adv(strings, ...values) {
  let code = '';
  for (let i = 0; i < strings.length; i++) {
    code += strings[i];
    if (i < values.length) {
      code += values[i];
    }
  }
  return run(parse(code), adv.context);
}

adv.context = createContext();
adv.reset = () => (adv.context = createContext());
