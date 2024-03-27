import { parse } from './parser.js';
import { run } from './run.js';

export function createContext() {
  return Object.create(defaultContext);
}

const defaultContext = Object.create(null, {
  '_+': {
    value: function add(a, b) {
      return a + b;
    },
    enumerable: true,
  },
  '_-': {
    value: function sub(a, b) {
      return a - b;
    },
    enumerable: true,
  },
  '_*': {
    value: function mul(a, b) {
      return a * b;
    },
    enumerable: true,
  },
  '_/': {
    value: function div(a, b) {
      return a / b;
    },
    enumerable: true,
  },
  '_<': {
    value: function lt(a, b) {
      return a < b;
    },
    enumerable: true,
  },
  '_>': {
    value: function gt(a, b) {
      return a > b;
    },
    enumerable: true,
  },
  '_=': {
    value: function eq(a, b) {
      return a === b;
    },
    enumerable: true,
  },
  avg: {
    value: function avg(block) {
      // TODO use list
      const nums = block.filter((v) => typeof v === 'number');
      return nums.reduce((acc, v) => acc + v, 0) / nums.length;
    },
    enumerable: true,
  },
  eval: {
    value: function evalFn(code) {
      return run(parse(code), this);
    },
    enumerable: true,
  },
  either: {
    value: function either(condition, block, elseBlock) {
      if (condition) {
        return run(block, this);
      } else {
        return run(elseBlock, this);
      }
    },
    enumerable: true,
  },
  if: {
    value: function ifFn(condition, block) {
      if (condition) {
        return run(block, this);
      }
      return condition;
    },
    enumerable: true,
  },
  inc: {
    value: function inc(v) {
      return v + 1;
    },
    enumerable: true,
  },
  list: {
    value: function list(block) {
      // TODO evaluate each value (until it resolve to a literal) and make an array? cache in Block?
      throw new Error('not implemented');
    },
    enumerable: true,
  },
  loop: {
    value: function loop(n, block) {
      for (let i = 1; i <= n; i++) {
        run(block, this, i);
      }
      return n;
    },
    enumerable: true,
  },
  max: {
    value: function max(block) {
      // TODO use list
      return Math.max(...block.filter((v) => typeof v === 'number'));
    },
    enumerable: true,
  },
  min: {
    value: function min(block) {
      // TODO use list
      return Math.min(...block.filter((v) => typeof v === 'number'));
    },
    enumerable: true,
  },
  print: {
    value: function print(v) {
      console.log(v?.toString?.() ?? v);
      return v;
    },
    enumerable: true,
  },
  printv: {
    value: function printv(v, fmt) {
      console.log(fmt.replace('{}', v));
      return v;
    },
    enumerable: true,
  },
  replace: {
    value: function replace(str, word, replacement) {
      return str.replace(word, replacement);
    },
    enumerable: true,
  },
  sum: {
    value: function sum(block) {
      // TODO use list
      return block
        .filter((v) => typeof v === 'number')
        .reduce((acc, v) => acc + v, 0);
    },
    enumerable: true,
  },
  with: {
    value: function withFn(v, block) {
      return run(block, this, v);
    },
    enumerable: true,
  },
});
