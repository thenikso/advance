// @ts-check

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
  let cursorExpectFirstArgSwapTo = 0;
  const cursorQueue = [];

  function expect(fn, argc, firstArgSwapTo = 0) {
    if (cursorExpectCount > 0) {
      cursorQueue.push(
        cursor,
        cursorExpectArgs,
        cursorExpectCount,
        cursorExpectFirstArgSwapTo,
      );
    }
    cursor = fn;
    cursorExpectArgs = [];
    cursorExpectCount = argc;
    cursorExpectFirstArgSwapTo = firstArgSwapTo;
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
        if (cursorExpectFirstArgSwapTo > 0) {
          const arg = cursorExpectArgs.shift();
          cursorExpectArgs.splice(cursorExpectFirstArgSwapTo, 0, arg);
        }
        const newCursor = cursor.apply(context, cursorExpectArgs);
        cursorExpectFirstArgSwapTo = cursorQueue.pop() || 0;
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

    if (typeof node === 'boolean') {
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

      if (node.kind === 'lset') {
        if (cursorExpectCount > 0) {
          throw new Error('cannot set an incomplete expression');
        }
        context[node.word] = cursor;
        provide(cursor);
        continue;
      }

      const value = context[node.word];
      if (typeof value === 'undefined') {
        throw new Error(`word not found: ${node.word}`);
      }

      switch (node.kind) {
        case 'pipe':
          if (cursorExpectCount > 0) {
            throw new Error('cannot pipe an incomplete expression');
          }
          if (typeof value === 'function') {
            if (value.length > 0) {
              const v = cursor;
              expect(value, value.length, node.star ? 1 : 0);
              provide(v);
            } else {
              provide(value());
            }
          } else {
            provide(value);
          }
          break;
        case 'op':
          if (typeof value === 'function') {
            if (value.length > 0) {
              expect(value, value.length, node.star ? 1 : 0);
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

  // TODO if till expect, then error out

  return cursor;
}
