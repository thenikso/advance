import { parse } from './parser.js';
import { run } from './run.js';

export function createContext() {
  return Object.create(defaultContext);
}

export function declareFn(context, name, fn, pure = false) {
  if (typeof name !== 'string') {
    throw new Error('name must be a string');
  }
  if (typeof fn !== 'function') {
    throw new Error('fn must be a function');
  }
  // TODO set pure flag
  Object.defineProperty(context, name, {
    value: fn,
    enumerable: true,
    writable: false,
    configurable: false,
  });
  return context;
}

const defaultContext = Object.create(null);

declareFn(
  defaultContext,
  '_+',
  function add(a, b) {
    return a + b;
  },
  true,
);

declareFn(
  defaultContext,
  '_-',
  function sub(a, b) {
    return a - b;
  },
  true,
);

declareFn(
  defaultContext,
  '_*',
  function mul(a, b) {
    return a * b;
  },
  true,
);

declareFn(
  defaultContext,
  '_/',
  function div(a, b) {
    return a / b;
  },
  true,
);

declareFn(
  defaultContext,
  '_<',
  function lt(a, b) {
    return a < b;
  },
  true,
);

declareFn(
  defaultContext,
  '_>',
  function gt(a, b) {
    return a > b;
  },
  true,
);

declareFn(
  defaultContext,
  '_=',
  function eq(a, b) {
    return a === b;
  },
  true,
);

declareFn(
  defaultContext,
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
  defaultContext,
  'avg',
  function avg(block) {
    // TODO use list
    const nums = block.filter((v) => typeof v === 'number');
    return nums.reduce((acc, v) => acc + v, 0) / nums.length;
  },
  true,
);

declareFn(
  defaultContext,
  'do',
  function doFn(block) {
    return run(block, this);
  },
  false,
);

declareFn(
  defaultContext,
  'eval',
  function evalFn(code) {
    return run(parse(code), this);
  },
  false,
);

declareFn(
  defaultContext,
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
  defaultContext,
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
  defaultContext,
  'inc',
  function inc(v) {
    return v + 1;
  },
  true,
);

declareFn(
  defaultContext,
  'list',
  function list(block) {
    // TODO evaluate each value (until it resolve to a literal) and make an array? cache in Block?
    throw new Error('not implemented');
  },
  true,
);

declareFn(
  defaultContext,
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
  defaultContext,
  'max',
  function max(block) {
    // TODO use list
    return Math.max(...block.filter((v) => typeof v === 'number'));
  },
  true,
);

declareFn(
  defaultContext,
  'min',
  function min(block) {
    // TODO use list
    return Math.min(...block.filter((v) => typeof v === 'number'));
  },
  true,
);

declareFn(
  defaultContext,
  'print',
  function print(v) {
    console.log(v?.toString?.() ?? v);
    return v;
  },
  false,
);

declareFn(
  defaultContext,
  'printv',
  function printv(v, fmt) {
    console.log(fmt.replace('{}', v));
    return v;
  },
  false,
);

declareFn(
  defaultContext,
  'replace',
  function replace(str, word, replacement) {
    return str.replace(word, replacement);
  },
  true,
);

declareFn(
  defaultContext,
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
  defaultContext,
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
  defaultContext,
  'with',
  function withFn(v, block) {
    return run(block, this, v);
  },
  false,
);
