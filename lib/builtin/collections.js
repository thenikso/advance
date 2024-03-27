import { run } from '../run.js';
import { isWord, isLiteral, isBlock } from '../ast.js';

export default function builtin(ctx, declareFn) {
  declareFn(
    ctx,
    '#->',
    function getArrow(data, key) {
      if (data instanceof Map) {
        return data.get(key);
      }
      if (data instanceof Object) {
        return data[key];
      }
      throw new Error('Invalid data type for _->');
    },
    false,
  );

  declareFn(
    ctx,
    'avg',
    function avg(block) {
      const nums = list.call(this, block).filter((v) => typeof v === 'number');
      return nums.reduce((acc, v) => acc + v, 0) / nums.length;
    },
    true,
  );

  declareFn(
    ctx,
    'dict',
    function dictFn(block) {
      const dict = new Map();
      let k, v;
      for (let i = 0, l = block.length; i < l; ) {
        k = block[i];
        if (isWord(k)) {
          if (k.kind === 'set' || k.kind === 'normal') {
            k = k.word;
          } else if (k.kind === 'lit') {
            k = Symbol.for(k.word);
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
    },
    false,
  );

  declareFn(ctx, 'join', function join(block) {
    return list.call(this, block).join('');
  });

  declareFn(ctx, 'list', list, true);

  declareFn(
    ctx,
    'map',
    function mapFn(list, block) {
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
    true,
  );

  declareFn(
    ctx,
    'max',
    function max(block) {
      return Math.max(
        ...list.call(this, block).filter((v) => typeof v === 'number'),
      );
    },
    true,
  );

  declareFn(
    ctx,
    'min',
    function min(block) {
      return Math.min(
        ...list.call(this, block).filter((v) => typeof v === 'number'),
      );
    },
    true,
  );

  declareFn(
    ctx,
    'sum',
    function sum(block) {
      return list
        .call(this, block)
        .filter((v) => typeof v === 'number')
        .reduce((acc, v) => acc + v, 0);
    },
    true,
  );
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
