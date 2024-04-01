import { run } from '../run.js';
import { list } from './collections.js';

export class Future {
  constructor(promise) {
    this.promise = promise;
  }

  toString() {
    return `Future(${this.promise})`;
  }
}

export function asFuture(value) {
  if (value.__proto__ === Future.prototype) {
    return value;
  }
  if (value.__proto__ === Promise.prototype) {
    return new Future(value);
  }
  if (typeof value === 'function') {
    return new Future(new Promise(value));
  }
  return new Future(Promise.resolve(value));
}

export default function builtin(ctx, declareFn) {
  declareFn(ctx, {
    name: 'is-future',
    pure: true,
    fn: function isFuture(value) {
      return value instanceof Future;
    },
  });

  declareFn(ctx, {
    name: 'await',
    fn: function awaitFuture(future) {
      if (Array.isArray(future)) {
        return Promise.all(
          list.call(this, future).map((f) => (f.promise ? f.promise : f)),
        );
      }
      if (future instanceof Future) {
        return future.promise;
      }
      return future;
    },
  });

  declareFn(ctx, {
    name: 'promise',
    fn: function promiseFn(block) {
      const ctx = Object.create(this);
      return new Promise((resolve) => {
        Object.defineProperty(ctx, Symbol.for('reject'), {
          value(v) {
            return Promise.reject(v);
          },
          enumerable: true,
        });
        resolve(run(block, ctx));
      });
    },
  });

  declareFn(ctx, {
    name: 'timeout',
    fn: async function timeoutFn(val, ms) {
      return new Promise((resolve) => setTimeout(() => resolve(val), ms));
    },
  });

  declareFn(ctx, {
    name: 'then',
    fn: async function thenFn(future, block) {
      if (!(future instanceof Future)) {
        throw new Error('Expected a future');
      }
      return asFuture(future.promise.then((v) => run(block, this, v)));
    },
  });
}
