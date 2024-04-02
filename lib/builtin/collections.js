import { run, buildList } from '../run.js';
import { isWord, isLiteral, isBlock } from '../ast.js';

export default function builtin(ctx, declareFn) {
  declareFn(ctx, {
    name: 'get',
    pure: false,
    fn: function getFn(data, key) {
      if (data instanceof Map) {
        return data.get(key);
      }
      if (typeof data === 'object') {
        return data[key];
      }
      throw new Error('Invalid data type for get');
    },
  });

  declareFn(ctx, {
    name: 'has',
    pure: true,
    fn: function hasFn(data, key) {
      if (data instanceof Map) {
        return data.has(key);
      }
      if (typeof data === 'object') {
        return key in data;
      }
      throw new Error('Invalid data type for has');
    },
  });

  declareFn(ctx, {
    name: 'avg',
    fn: function avg(block) {
      const nums = list.call(this, block).filter((v) => typeof v === 'number');
      return nums.reduce((acc, v) => acc + v, 0) / nums.length;
    },
    pure: true,
  });

  declareFn(ctx, {
    name: 'dict',
    fn: dict,
    pure: false,
  });

  declareFn(ctx, {
    name: 'filter',
    pure: true,
    fn: function filterFn(list, block) {
      const ctx = Object.create(this);
      if (Array.isArray(list)) {
        return list.filter((v, i) => {
          ctx[indexSymbol] = i;
          ctx[keySymbol] = i;
          ctx[valueSymbol] = v;
          return runOrCall(block, ctx, v);
        });
      }
      if (list instanceof Map) {
        const res = new Map();
        let i = 0;
        for (const [k, v] of list.entries()) {
          ctx[indexSymbol] = i++;
          ctx[keySymbol] = k;
          ctx[valueSymbol] = v;
          if (runOrCall(block, ctx, v)) {
            res.set(k, v);
          }
        }
        return res;
      }
      throw new Error('Invalid data type for filter');
    },
  });

  declareFn(ctx, {
    name: 'find',
    pure: true,
    fn: function findFn(list, block) {
      const ctx = Object.create(this);
      if (Array.isArray(list)) {
        return list.find((v, i) => {
          ctx[indexSymbol] = i;
          ctx[keySymbol] = i;
          ctx[valueSymbol] = v;
          return runOrCall(block, ctx, v);
        });
      }
      if (list instanceof Map) {
        let i = 0;
        for (const [k, v] of list.entries()) {
          ctx[indexSymbol] = i++;
          ctx[keySymbol] = k;
          ctx[valueSymbol] = v;
          if (runOrCall(block, ctx, v)) {
            return v;
          }
        }
        return undefined;
      }
      throw new Error('Invalid data type for find');
    },
  });

  declareFn(ctx, {
    name: 'first',
    pure: true,
    fn: function firstFn(block) {
      return block?.[0];
    },
  });

  declareFn(ctx, {
    name: 'group',
    pure: true,
    fn: function groupFn(list, block) {
      const ctx = Object.create(this);
      const res = new Map();
      if (Array.isArray(list)) {
        list.forEach((v, i) => {
          ctx[indexSymbol] = i;
          ctx[keySymbol] = i;
          ctx[valueSymbol] = v;
          const key = runOrCall(block, ctx, v);
          if (!res.has(key)) {
            res.set(key, []);
          }
          res.get(key).push(v);
        });
        return res;
      }
      if (list instanceof Map) {
        let i = 0;
        for (const [k, v] of list.entries()) {
          ctx[indexSymbol] = i++;
          ctx[keySymbol] = k;
          ctx[valueSymbol] = v;
          const key = runOrCall(block, ctx, v);
          if (!res.has(key)) {
            res.set(key, []);
          }
          res.get(key).push(v);
        }
        return res;
      }
      throw new Error('Invalid data type for group');
    },
  });

  declareFn(ctx, {
    name: 'insert',
    pure: false,
    fn: function insertFn(collection, block) {
      if (collection instanceof Map) {
        dict.call(this, block).forEach((v, k) => collection.set(k, v));
        return collection;
      }
      if (Array.isArray(collection)) {
        collection.push(...list.call(this, block));
        return collection;
      }
      throw new Error('Invalid data type for insert');
    },
  });

  declareFn(ctx, {
    name: 'join',
    fn: function join(block) {
      return list.call(this, block).join('');
    },
    pure: true,
  });

  declareFn(ctx, { name: 'list', fn: list, pure: true });

  const indexSymbol = Symbol.for('index');
  const keySymbol = Symbol.for('key');
  const valueSymbol = Symbol.for('value');

  declareFn(ctx, {
    name: 'map',
    fn: function mapFn(list, block) {
      const ctx = Object.create(this);
      if (Array.isArray(list)) {
        return list.map((v, i) => {
          ctx[indexSymbol] = i;
          ctx[keySymbol] = i;
          ctx[valueSymbol] = v;
          return runOrCall(block, ctx, v);
        });
      }
      if (list instanceof Map) {
        const res = new Map();
        let i = 0;
        for (const [k, v] of list.entries()) {
          ctx[indexSymbol] = i++;
          ctx[keySymbol] = k;
          ctx[valueSymbol] = v;
          res.set(k, runOrCall(block, ctx, v));
        }
        return res;
      }
      if (typeof list === 'string') {
        return list
          .split('')
          .map((v, i) => {
            ctx[indexSymbol] = i;
            ctx[keySymbol] = i;
            ctx[valueSymbol] = v;
            return runOrCall(block, ctx, v);
          })
          .join('');
      }
      throw new Error('Invalid data type for map');
    },
    pure: true,
  });

  declareFn(ctx, {
    name: 'max',
    fn: function max(block) {
      return Math.max(
        ...list.call(this, block).filter((v) => typeof v === 'number'),
      );
    },
    pure: true,
  });

  declareFn(ctx, {
    name: 'min',
    fn: function min(block) {
      return Math.min(
        ...list.call(this, block).filter((v) => typeof v === 'number'),
      );
    },
    pure: true,
  });

  declareFn(ctx, {
    name: 'partition',
    pure: true,
    fn: function partitionFn(list, block) {
      const ctx = Object.create(this);
      const res = [[], []];
      if (Array.isArray(list)) {
        list.forEach((v, i) => {
          ctx[indexSymbol] = i;
          ctx[keySymbol] = i;
          ctx[valueSymbol] = v;
          if (runOrCall(block, ctx, v)) {
            res[0].push(v);
          } else {
            res[1].push(v);
          }
        });
        return res;
      }
      if (list instanceof Map) {
        let i = 0;
        for (const [k, v] of list.entries()) {
          ctx[indexSymbol] = i++;
          ctx[keySymbol] = k;
          ctx[valueSymbol] = v;
          if (runOrCall(block, ctx, v)) {
            res[0].push(v);
          } else {
            res[1].push(v);
          }
        }
        return res;
      }
      throw new Error('Invalid data type for partition');
    },
  });

  declareFn(ctx, {
    name: 'reduce',
    pure: true,
    fn: function reduceFn(list, accWord, initialValue, block) {
      if (typeof accWord !== 'symbol') {
        throw new Error('Invalid accumulator word. Expected a lit word');
      }
      const ctx = Object.create(this);
      if (Array.isArray(list)) {
        return list.reduce((acc, v, i) => {
          ctx[accWord] = acc;
          ctx[indexSymbol] = i;
          ctx[keySymbol] = i;
          ctx[valueSymbol] = v;
          return run(block, ctx, v);
        }, initialValue);
      }
      if (list instanceof Map) {
        return [...list.entries()].reduce((acc, [k, v], i) => {
          ctx[accWord] = acc;
          ctx[indexSymbol] = i;
          ctx[keySymbol] = k;
          ctx[valueSymbol] = v;
          return run(block, ctx, v);
        }, initialValue);
      }
      throw new Error('Invalid data type for reduce');
    },
  });

  declareFn(ctx, {
    name: 'remove',
    pure: false,
    fn: function removeFn(collection, block) {
      if (collection instanceof Map) {
        list.call(this, block).forEach((k) => collection.delete(k));
        return collection;
      }
      if (Array.isArray(collection)) {
        list.call(this, block).forEach((v) => {
          const i = collection.indexOf(v);
          if (i !== -1) {
            collection.splice(i, 1);
          }
        });
        return collection;
      }
      throw new Error('Invalid data type for remove');
    },
  });

  declareFn(ctx, {
    name: 'sum',
    fn: function sum(block) {
      return list
        .call(this, block)
        .filter((v) => typeof v === 'number')
        .reduce((acc, v) => acc + v, 0);
    },
    pure: true,
  });
}

/**
 * Convert block to list
 * @param {any} block
 * @returns {any[]}
 */
export function list(block) {
  if (isBlock(block)) {
    return buildList.call(this, block);
  }
  if (Array.isArray(block)) {
    return block;
  }
  throw new Error('Invalid data type for list');
}

/**
 * Convert block to Map
 * @param {any} block
 * @returns {Map<any, any>}
 */
export function dict(block) {
  const res = new Map();
  let k, v;
  for (let i = 0, l = block.length; i < l; ) {
    k = block[i];
    if (isWord(k)) {
      if (k.kind === 'set' || k.kind === 'normal') {
        k = Symbol.keyFor(k.word);
      } else if (k.kind === 'lit') {
        k = k.word;
      } else {
        continue;
      }
    } else if (!isLiteral(k)) {
      continue;
    }
    v = run(block, this, undefined, i + 1, true);
    if (v.__proto__ === Promise.prototype) {
      return continueAsyncDict.call(this, block, res, k, v);
    }
    i = v.index;
    res.set(k, v.value);
  }
  return res;
}

async function continueAsyncDict(block, res, key, promise) {
  let v = await promise,
    k;
  res.set(key, v.value);
  for (let i = v.index, l = block.length; i < l; ) {
    k = block[i];
    if (isWord(k)) {
      if (k.kind === 'set' || k.kind === 'normal') {
        k = Symbol.keyFor(k.word);
      } else if (k.kind === 'lit') {
        k = k.word;
      } else {
        continue;
      }
    } else if (!isLiteral(k)) {
      continue;
    }
    v = await run(block, this, undefined, i + 1, true);
    i = v.index;
    res.set(k, v.value);
  }
  return res;
}

function runOrCall(blockOrFn, ctx, value) {
  if (typeof blockOrFn === 'function') {
    return blockOrFn.call(ctx, value);
  }
  return run(blockOrFn, ctx, value);
}
