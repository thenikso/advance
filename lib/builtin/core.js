import { parse } from '../parser.js';
import { run } from '../run.js';
import { isWord } from '../ast.js';

export default function builtin(ctx, declareFn) {
  declareFn(
    ctx,
    'context',
    function contextFn(block) {
      const ctx = Object.create(this);
      run(block, ctx);
      return ctx;
    },
    false,
  );

  declareFn(
    ctx,
    'context\\current',
    function contextCurrentFn() {
      return this;
    },
    false,
  );

  declareFn(
    ctx,
    'context\\parent',
    function contextParentFn() {
      return Object.getPrototypeOf(this);
    },
    false,
  );

  declareFn(
    ctx,
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
    ctx,
    'do',
    function doFn(block) {
      return run(block, this);
    },
    false,
  );

  declareFn(
    ctx,
    'do\\in',
    function doFn(ctx, block) {
      return run(block, ctx);
    },
    false,
  );

  declareFn(
    ctx,
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
    ctx,
    'eval',
    function evalFn(code) {
      return run(parse(code), this);
    },
    false,
  );

  declareFn(
    ctx,
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
    ctx,
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
    ctx,
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
    ctx,
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
    ctx,
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
    ctx,
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
    ctx,
    'replace',
    function replace(str, word, replacement) {
      return str.replace(word, replacement);
    },
    true,
  );

  declareFn(
    ctx,
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
    ctx,
    'with',
    function withFn(v, block) {
      return run(block, this, v);
    },
    false,
  );
}
