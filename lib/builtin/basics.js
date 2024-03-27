import { parse } from '../parser.js';
import { run } from '../run.js';
import { isWord, isLiteral } from '../ast.js';

export default function builtin(declareFn) {
  declareFn(
    '_+',
    function add(a, b) {
      return a + b;
    },
    true,
  );

  declareFn(
    '_-',
    function sub(a, b) {
      return a - b;
    },
    true,
  );

  declareFn(
    '_*',
    function mul(a, b) {
      return a * b;
    },
    true,
  );

  declareFn(
    '_/',
    function div(a, b) {
      return a / b;
    },
    true,
  );

  declareFn(
    '_<',
    function lt(a, b) {
      return a < b;
    },
    true,
  );

  declareFn(
    '_>',
    function gt(a, b) {
      return a > b;
    },
    true,
  );

  declareFn(
    '_=',
    function eq(a, b) {
      return a === b;
    },
    true,
  );

  declareFn(
    'avg',
    function avg(block) {
      // TODO use list
      const nums = block.filter((v) => typeof v === 'number');
      return nums.reduce((acc, v) => acc + v, 0) / nums.length;
    },
    true,
  );

  declareFn(
    'context',
    function contextFn(block) {
      const ctx = Object.create(this);
      run(block, ctx);
      return ctx;
    },
    false,
  );

  declareFn(
    'context\\current',
    function contextCurrentFn() {
      return this;
    },
    false,
  );

  declareFn(
    'context\\parent',
    function contextParentFn() {
      return Object.getPrototypeOf(this);
    },
    false,
  );

  declareFn(
    'closure',
    function closureFn(argsBlock, block) {
      const argNames = [];
      let a;
      for (let i = 0, l = argsBlock.length; i < l; i++) {
        a = argsBlock[i];
        if (!isWord(a) || a.kind !== 'normal') {
          throw new Error('Invalid argument name');
        }
        argNames.push(a.word);
      }
      const context = Object.create(this);
      // TODO mark as pure if possible
      function fn(...args) {
        const ctx = Object.create(context);
        for (let i = 0, l = argNames.length; i < l; i++) {
          ctx[argNames[i]] = args[i];
        }
        return run(block, ctx);
      }
      Object.defineProperty(fn, 'length', { value: argNames.length });
      return fn;
    },
    true,
  );

  declareFn(
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

  declareFn(
    'do',
    function doFn(block) {
      return run(block, this);
    },
    false,
  );

  declareFn(
    'do\\in',
    function doFn(ctx, block) {
      return run(block, ctx);
    },
    false,
  );

  declareFn(
    'does',
    function doesFn(block) {
      return function () {
        const ctx = Object.create(this);
        return run(block, ctx);
      };
    },
    true,
  );

  declareFn(
    'eval',
    function evalFn(code) {
      return run(parse(code), this);
    },
    false,
  );

  declareFn(
    'either',
    function either(condition, block, elseBlock) {
      if (condition) {
        return run(block, this, condition);
      } else {
        return run(elseBlock, this, condition);
      }
    },
    true,
  );

  declareFn(
    'for',
    function forFn(valuesBlock, block) {
      let result = valuesBlock;
      for (const v of valuesBlock) {
        result = run(block, this, v);
      }
      return result;
    },
    false,
  );

  declareFn(
    'fn',
    function fnFn(argsBlock, block) {
      const argNames = [];
      let a;
      for (let i = 0, l = argsBlock.length; i < l; i++) {
        a = argsBlock[i];
        if (!isWord(a) || a.kind !== 'normal') {
          throw new Error('Invalid argument name');
        }
        argNames.push(a.word);
      }
      // TODO mark as pure if possible
      function fn(...args) {
        const ctx = Object.create(this);
        for (let i = 0, l = argNames.length; i < l; i++) {
          ctx[argNames[i]] = args[i];
        }
        return run(block, ctx);
      }
      Object.defineProperty(fn, 'length', { value: argNames.length });
      return fn;
    },
    true,
  );

  declareFn(
    'fnc',
    function fnFnc(argsBlock, context, block) {
      const argNames = [];
      let a;
      for (let i = 0, l = argsBlock.length; i < l; i++) {
        a = argsBlock[i];
        if (!isWord(a) || a.kind !== 'normal') {
          throw new Error('Invalid argument name');
        }
        argNames.push(a.word);
      }
      // TODO mark as pure if possible
      function fn(...args) {
        const ctx = Object.create(context);
        for (let i = 0, l = argNames.length; i < l; i++) {
          ctx[argNames[i]] = args[i];
        }
        return run(block, ctx);
      }
      Object.defineProperty(fn, 'length', { value: argNames.length });
      return fn;
    },
    true,
  );

  declareFn(
    '_->',
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
    'if',
    function ifFn(condition, block) {
      if (condition) {
        return run(block, this, condition);
      }
      return condition;
    },
    true,
  );

  declareFn(
    'inc',
    function inc(v) {
      return v + 1;
    },
    true,
  );

  declareFn('join', function join(block) {
    return list.call(this, block).join('');
  });

  declareFn('list', list, true);
  function list(block) {
    const res = [];
    let v;
    for (let i = 0, l = block.length; i < l; ) {
      v = run(block, this, undefined, i, true);
      i = v.index;
      res.push(v.value);
    }
    return res;
  }

  declareFn(
    'loop',
    function loop(n, block) {
      for (let i = 1; i <= n; i++) {
        run(block, this, i);
      }
      return n;
    },
    false,
  );

  declareFn(
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
    'max',
    function max(block) {
      // TODO use list
      return Math.max(...block.filter((v) => typeof v === 'number'));
    },
    true,
  );

  declareFn(
    'min',
    function min(block) {
      // TODO use list
      return Math.min(...block.filter((v) => typeof v === 'number'));
    },
    true,
  );

  declareFn(
    'replace',
    function replace(str, word, replacement) {
      return str.replace(word, replacement);
    },
    true,
  );

  declareFn(
    'sum',
    function sum(block) {
      // TODO use list
      return block
        .filter((v) => typeof v === 'number')
        .reduce((acc, v) => acc + v, 0);
    },
    true,
  );

  declareFn(
    'switch',
    function switchFn(v, casesBlock) {
      let condition, ct, block;
      for (let i = 0, l = casesBlock.length; i < l; i += 2) {
        // TODO actually we should get a full value as condition?
        condition = casesBlock[i];
        ct = typeof condition;
        if (ct !== 'string' && ct !== 'number' && ct !== 'boolean') {
          condition = run([condition], this, v);
        }
        block = casesBlock[i + 1];
        if (condition === v) {
          return run(block, this, v);
        }
      }
      return v;
    },
    false,
  );

  declareFn(
    'with',
    function withFn(v, block) {
      return run(block, this, v);
    },
    false,
  );
}
