// @ts-check

import { isWord, isBlock, isList, isTerminator } from './ast.js';

/**
 * @typedef {import("./parser.js").Expression} Expression
 * @typedef {import("./ast.js").Block} Block
 */

/**
 * Run the given expression in the given context
 * @param {Expression|Block} expression The expression to run
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
  let cursorExpectArgs = undefined;
  let cursorExpectCount = 0;
  let cursorExpectFirstArgSwapTo = 0;
  const cursorQueue = [];
  let cursorQueueExpIndex = -1;

  const firstNode = expression[offset];
  let opNext = isWord(firstNode) && firstNode.kind === 'op';
  let nextValue = injectedValue;

  let i, l, node, nextNode, value;

  function expect(fn, argc, firstArgSwapTo = 0) {
    if (cursorQueueExpIndex < 0) {
      cursorQueueExpIndex = nextValue === undefined ? i : i - 1;
    }
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
        if (cursor === undefined) {
          cursorQueueExpIndex = -1;
        }
        provide(newCursor);
      }
    }
  }

  function dump() {
    if (cursorQueueExpIndex >= 0) {
      return `${expression
        .slice(cursorQueueExpIndex, i)
        .join(' ')
        .trim()} (here)`;
    }
    return '(here)';
  }

  function getWordValue(node, secondToLast = false) {
    value = context[node.word];
    if (node.path) {
      for (
        let i = 1, l = node.path.length - (secondToLast ? 1 : 0);
        i < l;
        i++
      ) {
        value = value[node.path[i]];
        if (typeof value === 'undefined') {
          break;
        }
      }
    }
    if (typeof value === 'undefined') {
      throw new Error(`word not found { ${dump()} ${node.toString()} }`);
    }
    return value;
  }

  for (i = offset, l = expression.length; i < l; i++) {
    if (
      stopAtFirstFullValue &&
      i > offset &&
      cursorExpectCount === 0 &&
      typeof nextValue === 'undefined' &&
      cursor !== undefined
    ) {
      return {
        value: cursor,
        index: i,
      };
    }

    node = expression[i];
    nextNode = expression[i + 1];
    opNext = isWord(nextNode) && nextNode.kind === 'op';

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
      switch (node.kind) {
        case 'set':
          {
            let c = context;
            let w = node.word;
            if (node.path) {
              c = getWordValue(node, true);
              w = node.path[node.path.length - 1];
            }
            expect(function set(v) {
              c[w] = v;
              return v;
            }, 1);
          }
          continue;
        case 'lset':
          if (cursorExpectCount > 0) {
            throw new Error(
              `cannot set an incomplete expression { ${dump()} ${node} }`,
            );
          } else {
            let c = context;
            let w = node.word;
            if (node.path) {
              c = getWordValue(node, true);
              w = node.path[node.path.length - 1];
            }
            c[w] = cursor;
            provide(cursor);
          }
          continue;
        case 'pipe':
          value = getWordValue(node);
          if (cursorExpectCount > 0) {
            throw new Error(
              `cannot pipe an incomplete expression { ${dump()} ${node.toString()} }`,
            );
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
          value = getWordValue(node);
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
          value = getWordValue(node);
          provide(value);
          break;
        case 'lit':
          if (node.path) {
            provide(node.pathWord);
          } else {
            provide(node.word);
          }
          break;
        case 'cpath':
          value = getWordValue(node);
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
        case 'normal':
          value = getWordValue(node);
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

    if (isList(node)) {
      value = [];
      for (let i = 0, l = node.length, v; i < l; ) {
        v = run(node, context, undefined, i, true);
        i = v.index;
        value.push(v.value);
      }
      provide(value);
      continue;
    }

    if (isTerminator(node)) {
      if (node.isGuard) {
        if (cursorExpectCount > 0) {
          throw new Error(`unexpected expression guard { ${dump()} , }`);
        }
        cursor = injectedValue;
        nextValue = injectedValue;
      }
      continue;
    }

    throw new Error(`unknown node type: ${node}`);
  }

  if (cursorExpectCount > 0) {
    throw new Error(`expected value { ${dump()} }`);
  }

  if (stopAtFirstFullValue) {
    return {
      value: cursor,
      index: expression.length,
    };
  }

  return cursor;
}
