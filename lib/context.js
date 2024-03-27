import { parse } from './parser.js';
import { run } from './run.js';

export function createContext() {
  return Object.create(defaultContext);
}

const defaultContext = Object.create(null, {
  eval: {
    value: function evalFn(code) {
      return run(parse(code), this);
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
  with: {
    value: function withFn(v, block) {
      return run(block, this, v);
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
  avg: {
    value: function avg(block) {
      // TODO use list
      const nums = block.filter((v) => typeof v === 'number');
      return nums.reduce((acc, v) => acc + v, 0) / nums.length;
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
  replace: {
    value: function replace(str, word, replacement) {
      return str.replace(word, replacement);
    },
    enumerable: true,
  },
});
