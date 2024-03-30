import { parse } from '../parser.js';
import { run } from '../run.js';
import { isWord } from '../ast.js';

async function importFn(path) {
  // TODO node specific import
  const code = await fetch(path).then((res) => res.text());
  const ast = parse(code);
  const res = run(ast, this);
  // TODO cache result
  return res;
}

export default function builtin(ctx, declareFn) {
  declareFn(ctx, {
    name: 'call',
    pure: false,
    fn: function callFn(f, args) {
      if (typeof f !== 'function') {
        throw new Error('First argument must be a function');
      }
      return f.apply(this, args);
    },
  });

  declareFn(ctx, {
    name: 'context',
    fn: function contextFn(block) {
      const ctx = Object.create(this);
      run(block, ctx);
      return ctx;
    },
    pure: false,
  });

  declareFn(ctx, {
    name: 'context-current',
    fn: function contextCurrentFn() {
      return this;
    },
    pure: false,
  });

  declareFn(ctx, {
    name: 'context-import',
    fn: async function contextImportFn(path) {
      const ctx = Object.create(this);
      await importFn.call(ctx, path);
      return ctx;
    },
    pure: false,
  });

  declareFn(ctx, {
    name: 'context-parent',
    fn: function contextParentFn() {
      return Object.getPrototypeOf(this);
    },
    pure: false,
  });

  declareFn(ctx, {
    name: 'closure',
    fn: function closureFn(argsBlock, block) {
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
    pure: true,
  });

  declareFn(ctx, {
    name: 'do',
    fn: function doFn(block) {
      return run(block, this);
    },
    pure: false,
  });

  declareFn(ctx, {
    name: 'do-in',
    fn: function doFn(ctx, block) {
      return run(block, ctx);
    },
    pure: false,
  });

  declareFn(ctx, {
    name: 'does',
    fn: function doesFn(block) {
      return function () {
        const ctx = Object.create(this);
        return run(block, ctx);
      };
    },
    pure: true,
  });

  declareFn(ctx, {
    name: 'eval',
    fn: function evalFn(code) {
      return run(parse(code), this);
    },
    pure: false,
  });

  declareFn(ctx, {
    name: 'either',
    fn: function either(condition, block, elseBlock) {
      if (condition) {
        return run(block, this, condition);
      } else {
        return run(elseBlock, this, condition);
      }
    },
    pure: true,
  });

  declareFn(ctx, {
    name: 'for',
    fn: function forFn(valuesBlock, block) {
      let result = valuesBlock;
      for (const v of valuesBlock) {
        result = run(block, this, v);
      }
      return result;
    },
    pure: false,
  });

  declareFn(ctx, {
    name: 'fn',
    fn: function fnFn(argsBlock, block) {
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
    pure: true,
  });

  declareFn(ctx, {
    name: 'fn1',
    fn: function fn1Fn(block) {
      function fn(arg) {
        const ctx = Object.create(this);
        return run(block, ctx, arg);
      }
      return fn;
    },
  });

  declareFn(ctx, {
    name: 'fnc',
    fn: function fnFnc(argsBlock, context, block) {
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
    pure: true,
  });

  declareFn(ctx, {
    name: 'import',
    pure: false,
    fn: importFn,
  });

  declareFn(ctx, {
    name: 'if',
    fn: function ifFn(condition, block) {
      if (condition) {
        return run(block, this, condition);
      }
      return condition;
    },
    pure: true,
  });

  declareFn(ctx, {
    name: 'loop',
    fn: function loop(n, block) {
      for (let i = 1; i <= n; i++) {
        run(block, this, i);
      }
      return n;
    },
    pure: false,
  });

  declareFn(ctx, {
    name: 'replace',
    fn: function replace(str, word, replacement) {
      return str.replace(word, replacement);
    },
    pure: true,
  });

  declareFn(ctx, {
    name: 'switch',
    fn: function switchFn(v, casesBlock) {
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
    pure: false,
  });

  declareFn(ctx, {
    name: 'with',
    fn: function withFn(v, block) {
      return run(block, this, v);
    },
    pure: false,
  });
}
