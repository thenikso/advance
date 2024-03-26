// @ts-check

import { parse } from './parser.js';
import { isWord, isBlock, isTerminator } from './ast.js';

/**
 * @typedef {import("./parser.js").Expression} Expression
 */

/**
 * Run the given expression in the given context
 * @param {Expression} expression
 * @param {Object} context
 * @param {import('./ast.js').Value=} injectedValue
 */
export function run(expression, context, injectedValue) {
  // console.log('expression', expression);
  /** @type {any} */
  let cursor = injectedValue;
  let cursorExpectCount = 0;
  let cursorExpectArgs = undefined;
  const cursorQueue = [];

  function expect(fn, argc) {
    if (cursorExpectCount > 0) {
      cursorQueue.push(cursor, cursorExpectArgs, cursorExpectCount);
    }
    cursor = fn;
    cursorExpectArgs = [];
    cursorExpectCount = argc;
  }

  /** @type {any} */
  let nextValue = injectedValue;
  function consumeNextValue() {
    if (typeof nextValue === 'undefined') {
      return;
    }
    if (cursorExpectCount === 0) {
      cursor = nextValue;
    } else {
      cursorExpectArgs.push(nextValue);
      cursorExpectCount -= 1;
      if (cursorExpectCount === 0 && typeof cursor === 'function') {
        nextValue = cursor.apply(context, cursorExpectArgs);
        cursorExpectCount = cursorQueue.pop() || 0;
        cursorExpectArgs = cursorQueue.pop();
        cursor = cursorQueue.pop();
        // consumeNextValue();
      } else {
        nextValue = undefined;
      }
    }
  }

  for (let i = 0, l = expression.length; i < l; i++) {
    const node = expression[i];
    if (typeof node === 'string') {
      consumeNextValue();
      nextValue = node;
    } else if (typeof node === 'number') {
      consumeNextValue();
      nextValue = node;
    } else if (isWord(node)) {
      const value = context[node.word];
      if (typeof value === 'undefined') {
        throw new Error(`word not found: ${node.word}`);
      }
      let argc = 0;
      if (typeof value === 'function') {
        argc = value.length;
      }
      switch (node.kind) {
        case 'pipe':
          throw new Error('pipe not implemented');
        case 'op':
          if (argc > 0) {
            if (typeof nextValue === 'undefined') {
              nextValue = cursor;
            }
            if (typeof nextValue === 'undefined') {
              throw new Error(`op needs a value: ${node.word}`);
            }
            expect(value, argc);
            consumeNextValue();
          } else {
            consumeNextValue();
            nextValue = value;
          }
          break;
        case 'get':
          consumeNextValue();
          nextValue = value;
          break;
        case 'lset':
          throw new Error('lset not implemented');
        case 'set':
          throw new Error('set not implemented');
        case 'lit':
          consumeNextValue();
          nextValue = Symbol.for(node.word);
          break;
        case 'normal':
          if (argc > 0) {
            expect(value, argc);
          } else {
            consumeNextValue();
            nextValue = value;
          }
          break;
        default:
          throw new Error(`unknown word kind: ${node.kind}`);
      }
    } else if (isBlock(node)) {
      consumeNextValue();
      nextValue = node;
    } else if (isTerminator(node)) {
      if (node.comma) {
        consumeNextValue();
        if (cursorExpectCount > 0) {
          throw new Error('unexpected comma');
        }
        cursor = injectedValue;
        nextValue = undefined;
      }
    } else {
      throw new Error(`unknown node type: ${node}`);
    }
  }
  consumeNextValue();
  return cursor;
}

export const defaultContext = Object.create(null, {
  eval: {
    value: function evalFn(code) {
      return run(parse(code), this);
    },
    writable: false,
  },
  print: {
    value: function print(v) {
      console.log(v?.toString?.() ?? v);
      return v;
    },
    writable: false,
  },
  printv: {
    value: function printv(v, fmt) {
      console.log(fmt.replace('{}', v));
      return v;
    },
    writable: false,
  },
  with: {
    value: function withFn(v, block) {
      return run(block.values, this, v);
    },
    writable: false,
  },
  inc: {
    value: function inc(v) {
      return v + 1;
    },
    writable: false,
  },
  list: {
    value: function list(block) {
      // TODO evaluate each value (until it resolve to a literal) and make an array? cache in Block?
      throw new Error('not implemented');
    },
    writable: false,
  },
  max: {
    value: function max(block) {
      // TODO use list
      return Math.max(...block.values.filter((v) => typeof v === 'number'));
    },
    writable: false,
  },
  min: {
    value: function min(block) {
      // TODO use list
      return Math.min(...block.values.filter((v) => typeof v === 'number'));
    },
    writable: false,
  },
  avg: {
    value: function avg(block) {
      // TODO use list
      const nums = block.values.filter((v) => typeof v === 'number');
      return nums.reduce((acc, v) => acc + v, 0) / nums.length;
    },
    writable: false,
  },
  sum: {
    value: function sum(block) {
      // TODO use list
      return block.values
        .filter((v) => typeof v === 'number')
        .reduce((acc, v) => acc + v, 0);
    },
    writable: false,
  },
});
