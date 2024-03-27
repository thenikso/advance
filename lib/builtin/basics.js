import { parse } from '../parser.js';
import { run } from '../run.js';

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
    'avg',
    function avg(block) {
      // TODO use list
      const nums = block.filter((v) => typeof v === 'number');
      return nums.reduce((acc, v) => acc + v, 0) / nums.length;
    },
    true,
  );

  declareFn(
    'do',
    function doFn(block) {
      return run(block, this);
    },
    false,
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
