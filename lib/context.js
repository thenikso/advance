import builtinBasics from './builtin/basics.js';
import builtinBrowser from './builtin/browser.js';

const defaultContext = Object.create(null);

export function createContext() {
  return Object.create(defaultContext);
}

export function declareFn(context, name, fn, pure = false) {
  if (typeof name !== 'string') {
    throw new Error('name must be a string');
  }
  if (typeof fn !== 'function') {
    throw new Error('fn must be a function');
  }
  // TODO set pure flag
  Object.defineProperty(context, name, {
    value: fn,
    enumerable: true,
    writable: false,
    configurable: false,
  });
  return context;
}

const declareFnInDefaultContext = declareFn.bind(null, defaultContext);

builtinBasics(declareFnInDefaultContext);
builtinBrowser(declareFnInDefaultContext);