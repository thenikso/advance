// @ts-check

import { parse } from './parser.js';
import { isWord, isBlock, isTerminator } from './ast.js';

/**
 * @typedef {import("./parser.js").Expression} Expression
 */

const RyeFn = Symbol('RyeFn');

export class Context {
  /**
   *
   * @param {Context=} parent
   */
  constructor(parent) {
    this.parent = parent;
    this.vars = {};
    this.proxy = new Proxy(this.vars, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        if (this.parent) {
          return this.parent.vars[prop];
        }
        return undefined;
      },
      set: (target, prop, value) => {
        target[prop] = value;
        return true;
      },
    });
  }

  createChild() {
    return new Context(this);
  }

  /**
   * Define a new function in this context
   * @param {string} word The word of the variable
   * @param {Function} fn The function to define
   */
  fn(word, fn) {
    fn[RyeFn] = true;
    this.vars[word] = fn;
  }

  /**
   * Run the given expression in this context
   * @param {string | Expression} expression The expression to evaluate
   * @returns {any} The result of the expression evaluation
   */
  run(expression) {
    if (typeof expression === 'string') {
      expression = parse(expression);
    }
    return run(expression, this.proxy);
  }

  /**
   * Parse the given code into an AST
   * @param {string} code The code to parse
   * @returns {Expression}
   */
  parse(code) {
    return parse(code);
  }
}

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
          throw new Error('get not implemented');
        case 'lset':
          throw new Error('lset not implemented');
        case 'set':
          throw new Error('set not implemented');
        case 'lit':
          throw new Error('lit not implemented');
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

export const defaultContext = new Context();

defaultContext.fn('print', function print(v) {
  console.log(v?.toString?.() ?? v);
  return v;
});

defaultContext.fn('printv', function printv(v, fmt) {
  console.log(fmt.replace('{}', v));
  return v;
});

defaultContext.fn(
  'with',
  /**
   * @this {Context}
   * @param {import('./ast.js').Value} v
   * @param {import('./ast.js').Block} block
   */
  function withFn(v, block) {
    return run(block.values, this, v);
  },
);

defaultContext.fn('inc', function inc(v) {
  return v + 1;
});

defaultContext.fn('list', function list(block) {
  // TODO evaluate each value (until it resolve to a literal) and make an array? cache in Block?
  throw new Error('not implemented');
});

defaultContext.fn('max', function max(block) {
  // TODO use list
  return Math.max(...block.values.filter((v) => typeof v === 'number'));
});

defaultContext.fn('min', function min(block) {
  // TODO use list
  return Math.min(...block.values.filter((v) => typeof v === 'number'));
});

defaultContext.fn('avg', function avg(block) {
  // TODO use list
  const nums = block.values.filter((v) => typeof v === 'number');
  return nums.reduce((acc, v) => acc + v, 0) / nums.length;
});

defaultContext.fn('sum', function sum(block) {
  // TODO use list
  return block.values
    .filter((v) => typeof v === 'number')
    .reduce((acc, v) => acc + v, 0);
});
