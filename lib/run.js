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

  const firstNode = expression[0];
  let opNext = isWord(firstNode) && firstNode.kind === 'op';
  let nextValue = injectedValue;
  function provide(value, force = false) {
    if (!force && opNext) {
      nextValue = value;
      opNext = false;
      return;
    }
    if (cursorExpectCount === 0) {
      cursor = value;
    } else {
      cursorExpectArgs.push(value);
      cursorExpectCount -= 1;
      if (cursorExpectCount === 0) {
        const newCursor = cursor.apply(context, cursorExpectArgs);
        cursorExpectCount = cursorQueue.pop() || 0;
        cursorExpectArgs = cursorQueue.pop();
        cursor = cursorQueue.pop();
        provide(newCursor);
      }
    }
  }

  for (let i = 0, l = expression.length, node, nextNode; i < l; i++) {
    nextNode = expression[i + 1];
    opNext = isWord(nextNode) && nextNode.kind === 'op';

    node = expression[i];

    if (typeof node === 'string') {
      provide(node);
      continue;
    }

    if (typeof node === 'number') {
      provide(node);
      continue;
    }

    if (isWord(node)) {
      if (node.kind === 'set') {
        const w = node.word;
        expect(function set(v) {
          context[w] = v;
          return v;
        }, 1);
        continue;
      }

      const value = context[node.word];
      if (typeof value === 'undefined') {
        throw new Error(`word not found: ${node.word}`);
      }

      switch (node.kind) {
        case 'pipe':
          throw new Error('pipe not implemented');
        case 'op':
          if (typeof value === 'function') {
            if (value.length > 0) {
              expect(value, value.length);
              provide(nextValue, true);
            } else {
              provide(value());
            }
          } else {
            provide(value);
          }
          break;
        case 'get':
          provide(value);
          break;
        case 'lset':
          throw new Error('lset not implemented');
        case 'lit':
          provide(Symbol.for(node.word));
          break;
        case 'normal':
          if (typeof value === 'function') {
            if (value.length > 0) {
              expect(value, value.length);
            } else {
              provide(value());
            }
          } else {
            provide(value);
          }
          break;
        default:
          throw new Error(`unknown word kind: ${node.kind}`);
      }
      continue;
    }

    if (isBlock(node)) {
      provide(node);
      continue;
    }

    if (isTerminator(node)) {
      if (node.comma) {
        if (cursorExpectCount > 0) {
          throw new Error('unexpected comma');
        }
        cursor = injectedValue;
        nextValue = injectedValue;
      }
      continue;
    }

    throw new Error(`unknown node type: ${node}`);
  }
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
