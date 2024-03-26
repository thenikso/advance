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
          return this.parent[prop];
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

export const defaultContext = new Context();

/**
 * Run the given expression in the given context
 * @param {Expression} expression
 * @param {Object} context
 */
export function run(expression, context) {
  // console.log('expression', expression);
  let cursor = undefined; // TODO init with injected context value
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
  function provide(value) {
    if (cursorExpectCount === 0) {
      cursor = value;
    } else {
      cursorExpectArgs.push(value);
      cursorExpectCount -= 1;
      if (cursorExpectCount === 0) {
        const newCursor = cursor.apply(null, cursorExpectArgs);
        cursorExpectCount = cursorQueue.pop() || 0;
        cursorExpectArgs = cursorQueue.pop();
        cursor = cursorQueue.pop();
        provide(newCursor);
      }
    }
  }
  for (let i = 0, l = expression.length; i < l; i++) {
    const node = expression[i];
    if (typeof node === 'string') {
      provide(node);
    } else if (typeof node === 'number') {
      provide(node);
    } else if (isWord(node)) {
      const value = context[node.word];
      const t = typeof value;
      if (t === 'undefined') {
        throw new Error(`word not found: ${node.word}`);
      }
      let argc = 0;
      if (t === 'function') {
        argc = value.length;
      }
      switch (node.kind) {
        case 'pipe':
          throw new Error('pipe not implemented');
        case 'op':
          throw new Error('op not implemented');
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
            provide(value);
          }
          break;
        default:
          throw new Error(`unknown word kind: ${node.kind}`);
      }
    } else if (isBlock(node)) {
      // TODO implement block
    } else if (isTerminator(node)) {
      // TODO implement terminator
    } else {
      throw new Error(`unknown node type: ${node}`);
    }
  }
  return cursor;
}
