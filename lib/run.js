// @ts-check

import { isWord, isBlock, isList, isTerminator } from './ast.js';
import { asFuture } from './builtin/futures.js';
import { setWordAsSignalIfNeeded, isSignalOrWatcher, signalValue } from './builtin/signals.js';

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
 * @param {any=} resume The state to use for resuming from an async operation
 * @returns {any} The result of the expression. If `stopAtFirstFullValue` is true, returns `{ value: any, index: number }`
 */
export function run(
  expression,
  context,
  injectedValue,
  offset = 0,
  stopAtFirstFullValue = false,
  resume,
) {
  /** @type {any} */
  let cursor = injectedValue;
  let cursorExpectArgs = undefined;
  let cursorExpectCount = 0;
  let cursorExpectFirstArgSwapTo = 0;
  let cursorExpectFuture = false;
  const cursorQueue = [];
  let cursorQueueExpIndex = -1;

  const firstNode = expression[offset];
  let opNext = isWord(firstNode) && firstNode.kind === 'op';
  let nextValue = injectedValue;

  let i, l, node, nextNode, value, maybePromise;

  if (resume) {
    cursor = resume.cursor;
    cursorExpectArgs = resume.cursorExpectArgs;
    cursorExpectCount = resume.cursorExpectCount;
    cursorExpectFirstArgSwapTo = resume.cursorExpectFirstArgSwapTo;
    cursorExpectFuture = resume.cursorExpectFuture;
    cursorQueue.push(...resume.cursorQueue);
    cursorQueueExpIndex = resume.cursorQueueExpIndex;

    opNext = resume.opNext;
    nextValue = resume.nextValue;

    provide(resume.provide);
  }

  function expect(fn, argc, future = false, firstArgSwapTo = 0) {
    if (cursorQueueExpIndex < 0) {
      cursorQueueExpIndex = nextValue === undefined ? i : i - 1;
    }
    if (cursorExpectCount > 0) {
      cursorQueue.push(
        cursor,
        cursorExpectArgs,
        cursorExpectCount,
        cursorExpectFirstArgSwapTo,
        cursorExpectFuture,
      );
    }
    cursor = fn;
    cursorExpectArgs = [];
    cursorExpectCount = argc;
    cursorExpectFirstArgSwapTo = firstArgSwapTo;
    cursorExpectFuture = future;
  }

  function provide(value, isNextValue = false) {
    if (isNextValue) {
      nextValue = undefined;
    } else if (opNext) {
      nextValue = value;
      opNext = false;
      return;
    }
    // if (value instanceof Promise) {
    if (value?.__proto__ === Promise.prototype) {
      // TODO can we resolve this and come back to this function?
      // make all the state in this funciton a `state` object
      // allow to receive the state in the params so that it can be resumed
      // let { cursor = injectedValue, ... } = state || {};
      // may also allow for these support function to be moved outside
      return value.then((v) =>
        run(expression, context, injectedValue, i, stopAtFirstFullValue, {
          cursor,
          cursorExpectArgs,
          cursorExpectCount,
          cursorExpectFirstArgSwapTo,
          cursorQueue,
          cursorQueueExpIndex,
          cursorExpectFuture,
          opNext,
          nextValue,
          provide: v,
        }),
      );
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
        let newCursor = cursor.apply(context, cursorExpectArgs);
        if (cursorExpectFuture) {
          newCursor = asFuture(newCursor);
        }
        cursorExpectFuture = cursorQueue.pop() || false;
        cursorExpectFirstArgSwapTo = cursorQueue.pop() || 0;
        cursorExpectCount = cursorQueue.pop() || 0;
        cursorExpectArgs = cursorQueue.pop();
        cursor = cursorQueue.pop();
        if (cursor === undefined) {
          cursorQueueExpIndex = -1;
        }
        return provide(newCursor);
      }
    }
  }

  function dump() {
    if (cursorQueueExpIndex >= 0) {
      return `${expression
        .slice(cursorQueueExpIndex, i)
        .map((n) => (typeof n === 'string' ? `"${n}"` : n.toString()))
        .join(' ')
        .trim()} (here)`;
    }
    return '(here)';
  }

  function getWordValue(node, secondToLast = false, keepSignals = false) {
    value = context[node.word];
    if (node.path) {
      for (
        let i = 1, l = node.path.length - (secondToLast ? 1 : 0);
        i < l;
        i++
      ) {
        value = value[node.path[i]];
        if (isSignalOrWatcher(value)) {
          if (keepSignals && i === l - 1) {
            break;
          }
          value = signalValue.call(context, value);
        }
        if (typeof value === 'undefined') {
          break;
        }
      }
    }
    if (typeof value === 'undefined') {
      throw new Error(`word not found { ${dump()} ${node.toString()} }`);
    }
    if (!keepSignals && isSignalOrWatcher(value)) {
      value = signalValue.call(context, value);
    }
    return value;
  }

  for (i = offset, l = expression.length; i < l; i++) {
    if (maybePromise) {
      return maybePromise;
    }

    if (
      stopAtFirstFullValue &&
      i >= offset &&
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
      maybePromise = provide(node);
      continue;
    }

    if (typeof node === 'number') {
      maybePromise = provide(node);
      continue;
    }

    if (typeof node === 'boolean') {
      maybePromise = provide(node);
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
              if (setWordAsSignalIfNeeded(c, w, v)) {
                return signalValue.call(context, v);
              }
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
            if (setWordAsSignalIfNeeded(c, w, cursor)) {
              cursor = signalValue.call(context, cursor);
            } else {
              c[w] = cursor;
            }
            maybePromise = provide(cursor);
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
              expect(value, value.length, node.future, node.star ? 1 : 0);
              maybePromise = provide(v);
            } else {
              value = value.call(context);
              if (node.future) value = asFuture(value);
              maybePromise = provide(value);
            }
          } else {
            if (node.future) value = asFuture(value);
            maybePromise = provide(value);
          }
          break;
        case 'op':
          value = getWordValue(node);
          if (typeof value === 'function') {
            if (value.length > 0) {
              expect(value, value.length, node.future, node.star ? 1 : 0);
              maybePromise = provide(nextValue, true);
            } else {
              value = value.call(context);
              if (node.future) value = asFuture(value);
              maybePromise = provide(value);
            }
          } else {
            if (node.future) value = asFuture(value);
            maybePromise = provide(value);
          }
          break;
        case 'get':
          value = getWordValue(node, false, true);
          maybePromise = provide(value);
          break;
        case 'lit':
          if (node.path) {
            maybePromise = provide(node.pathWord);
          } else {
            maybePromise = provide(node.word);
          }
          break;
        case 'cpath':
          value = getWordValue(node);
          if (typeof value === 'function') {
            if (value.length > 0) {
              expect(value, value.length);
            } else {
              maybePromise = provide(value.call(context));
            }
          } else {
            maybePromise = provide(value);
          }
          break;
        case 'normal':
          value = getWordValue(node);
          if (typeof value === 'function') {
            if (value.length > 0) {
              expect(value, value.length, node.future);
            } else {
              value = value.call(context);
              if (node.future) value = asFuture(value);
              maybePromise = provide(value);
            }
          } else {
            if (node.future) value = asFuture(value);
            maybePromise = provide(value);
          }
          break;
        default:
          throw new Error(`unknown word kind: ${node.kind}`);
      }
      continue;
    }

    if (isBlock(node)) {
      maybePromise = provide(node);
      continue;
    }

    if (isList(node)) {
      value = buildList.call(context, node);
      maybePromise = provide(value);
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

  if (maybePromise) {
    return maybePromise;
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

export function buildList(block) {
  const res = [];
  let v;
  for (let i = 0, l = block.length; i < l; ) {
    v = run(block, this, undefined, i, true);
    if (v.__proto__ === Promise.prototype) {
      return continueBuildAsyncList.call(this, block, res, v);
    }
    i = v.index;
    res.push(v.value);
  }
  return res;
}

async function continueBuildAsyncList(block, acc, promise) {
  let v = await promise;
  acc.push(v.value);
  for (let i = v.index, l = block.length; i < l; ) {
    v = await run(block, this, undefined, i, true);
    i = v.index;
    acc.push(v.value);
  }
  return acc;
}
