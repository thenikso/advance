import { run } from '../run.js';
import { isWord, isLiteral, isBlock } from '../ast.js';

export default function builtin(ctx, declareFn) {
  declareFn(ctx, {
    name: 'get',
    fn: function getArrow(data, key) {
      if (data instanceof Map) {
        return data.get(key);
      }
      if (typeof data === 'object') {
        return data[key];
      }
      throw new Error('Invalid data type for get');
    },
    pure: false,
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
    name: 'join',
    fn: function join(block) {
      return list.call(this, block).join('');
    },
    pure: true,
  });

  declareFn(ctx, { name: 'list', fn: list, pure: true });

  declareFn(ctx, {
    name: 'map',
    fn: function mapFn(list, block) {
      const ctx = Object.create(this);
      if (Array.isArray(list)) {
        return list.map((v, i) => {
          ctx.index = i;
          ctx.key = i;
          ctx.value = v;
          return run(block, ctx, v);
        });
      }
      if (list instanceof Map) {
        const res = new Map();
        let i = 0;
        for (const [k, v] of list.entries()) {
          ctx.index = i++;
          ctx.key = k;
          ctx.value = v;
          res.set(k, run(block, ctx, v));
        }
        return res;
      }
      if (typeof list === 'string') {
        return list
          .split('')
          .map((v, i) => {
            ctx.index = i;
            ctx.key = i;
            ctx.value = v;
            return run(block, ctx, v);
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
    const res = [];
    let v;
    for (let i = 0, l = block.length; i < l; ) {
      v = run(block, this, undefined, i, true);
      i = v.index;
      res.push(v.value);
    }
    return res;
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
  const dict = new Map();
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
    i = v.index;
    dict.set(k, v.value);
  }
  return dict;
}
