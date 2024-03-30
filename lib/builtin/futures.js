import { run } from '../run.js';

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
      if (!(future instanceof Future)) {
        throw new Error('Expected a future');
      }
      return future.promise;
    },
  });

  declareFn(ctx, {
    name: 'promise',
    fn: function promiseFn(block) {
      const ctx = Object.create(this);
      return new Promise((resolve) => {
        ctx[Symbol.for('reject')] = (v) => Promise.reject(v);
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
