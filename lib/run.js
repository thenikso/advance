// @ts-check

import { isWord, isBlock, isTerminator } from './ast.js';

/**
 * @typedef {import("./parser.js").Expression} Expression
 */

/**
 * Run the given expression in the given context
 * @param {Expression} expression The expression to run
 * @param {Object} context An object to use as the context
 * @param {import('./ast.js').Value=} injectedValue The value to inject as cursor at the start
 * @param {number=} offset The offset to start at in the expression
 * @param {boolean=} stopAtFirstFullValue Stop at the first full value
 * @returns {any} The result of the expression. If `stopAtFirstFullValue` is true, returns `{ value: any, index: number }`
 */
export function run(
  expression,
  context,
  injectedValue,
  offset = 0,
  stopAtFirstFullValue = false,
) {
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

  const firstNode = expression[offset];
  let opNext = isWord(firstNode) && firstNode.kind === 'op';
  let nextValue = injectedValue;
  function provide(value, isNextValue = false) {
    if (isNextValue) {
      nextValue = undefined;
    } else if (opNext) {
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

  for (let i = offset, l = expression.length, node, nextNode; i < l; i++) {
    if (
      stopAtFirstFullValue &&
      i > offset &&
      cursorExpectCount === 0 &&
      typeof nextValue === 'undefined'
    ) {
      return {
        value: cursor,
        index: i,
      };
    }

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
              provide(value.call(context));
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
              provide(value.call(context));
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
              provide(value.call(context));
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

  if (stopAtFirstFullValue) {
    return {
      value: cursor,
      index: expression.length,
    };
  }
  return cursor;
}
