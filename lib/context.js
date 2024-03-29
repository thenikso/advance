import builtins from './builtin/index.js';

import installTypes from './extras/types.js';

const defaultContext = Object.create(null);
builtins(defaultContext, declareFn);
// TODO load types only if in development environment or on request
installTypes(defaultContext, declareFn);

/**
 * Create a new context. By default a context derives from the default context.
 * @param {{ parent?: Object | null }=} options
 * @returns {Object} a new context
 */
export function createContext(options) {
  const ctx = Object.create(
    options?.parent !== undefined ? options.parent : defaultContext,
  );
  return ctx;
}

/**
 * @param {Object} context the context in which to declare the function
 * @param {{ name: string | symbol, fn: Function, pure?: boolean }} params the parameters for the function
 */
export function declareFn(context, params) {
  const { name, fn, pure = false } = params;
  let word = name;
  if (typeof word === 'string') {
    word = Symbol.for(word);
  }
  if (typeof word !== 'symbol') {
    throw new Error('name must be a string or symbol');
  }
  if (typeof fn !== 'function') {
    throw new Error('fn must be a function');
  }
  // TODO set `pure` flag
  // TODO accept and set `doc` property
  // TODO accept and set types for both arguments and return value
  Object.defineProperty(context, word, {
    value: fn,
    enumerable: true,
    writable: false,
    configurable: false,
  });
  return context;
}
