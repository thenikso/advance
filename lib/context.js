import builtins from './builtin/index.js';

const defaultContext = Object.create(null);
builtins(defaultContext, declareFn);

export function createContext() {
  return Object.create(defaultContext);
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
  // TODO set pure flag
  Object.defineProperty(context, word, {
    value: fn,
    enumerable: true,
    writable: false,
    configurable: false,
  });
  return context;
}
