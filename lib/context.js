import builtins from './builtin/index.js';

const defaultContext = Object.create(null);
builtins(defaultContext, declareFn);

export function createContext() {
  return Object.create(defaultContext);
}

/**
 * @param {Object} context the context in which to declare the function
 * @param {string | Symbol} word the name of the function (will be converted to symbol)
 * @param {Function} fn the function to declare
 * @param {boolean} pure whether the function is pure or not
 */
export function declareFn(context, word, fn, pure = false) {
  if (typeof word === 'string') {
    word = Symbol.for(word);
  }
  if (typeof word !== 'symbol') {
    throw new Error('word must be a string or symbol');
  }
  if (typeof fn !== 'function') {
    throw new Error('fn must be a function');
  }
  // TODO set pure flag
  Object.defineProperty(context, word, {
    value: fn,
    enumerable: true,
    writable: false,
    configurable: false,
  });
  return context;
}
