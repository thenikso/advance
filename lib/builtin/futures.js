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
  if (value instanceof Future) {
    return value;
  }
  if (value instanceof Promise) {
    return new Future(value);
  }
  return new Future(Promise.resolve(value));
}

export default function builtin(ctx, declareFn) {
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
    fn: async function thenFn(promise, block) {
      if (!(promise instanceof Promise)) {
        throw new Error('Expected a promise');
      }
      return promise.then((v) => run(block, this, v));
    },
  });
}
