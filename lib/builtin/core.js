import { parse } from '../parser.js';
import { run } from '../run.js';
import { isWord } from '../ast.js';
import { isNode } from '../env.js';

async function importFn(path) {
  let code;
  if (isNode && (path.startsWith('file://') || !URL.canParse(path))) {
    const fs = await import('node:fs/promises');
    code = await fs.readFile(path, 'utf8');
  } else {
    code = await fetch(path).then((res) => res.text());
  }
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
    name: 'call-in',
    pure: false,
    fn: function callFn(f, ctx, args) {
      if (typeof f !== 'function') {
        throw new Error('First argument must be a function');
      }
      return f.apply(ctx, args);
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
    name: 'context-parent',
    fn: function contextParentFn() {
      return Object.getPrototypeOf(this);
    },
    pure: false,
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
      // A function argsBlock is a list of words and lit words
      // The lit words are used to capture variables from the closure
      // The words are used to pass arguments to the function
      const argNames = [];
      const captureNames = [];
      let a;
      for (let i = 0, l = argsBlock.length; i < l; i++) {
        a = argsBlock[i];
        if (isWord(a)) {
          if (a.kind === 'normal') {
            argNames.push(a.word);
            continue;
          }
          if (a.kind === 'lit') {
            captureNames.push(a.word);
            continue;
          }
        }
        throw new Error(
          `Invalid argument name ${a}. Only words and lit words are allowed`,
        );
      }
      // Captures are resolved at function definition time
      // They are proxied getter/setters to the closure context that defines
      // the captured variable
      const ctxProps = {};
      for (let i = 0, l = captureNames.length; i < l; i++) {
        const captureWord = captureNames[i];
        let closureCtx = this;
        while (closureCtx && !Object.hasOwn(closureCtx, captureWord)) {
          closureCtx = Object.getPrototypeOf(closureCtx);
        }
        if (!closureCtx) {
          throw new Error(
            `Capture for word "${Symbol.keyFor(captureWord)}" not found`,
          );
        }
        ctxProps[captureWord] = {
          get() {
            return closureCtx[captureWord];
          },
          set(v) {
            closureCtx[captureWord] = v;
            return v;
          },
          enumerable: true,
        };
      }
      // Arguments are defined as properties of the function context
      for (let i = 0, l = argNames.length; i < l; i++) {
        ctxProps[argNames[i]] = {
          value: undefined,
          enumerable: true,
          writable: true,
        };
      }
      // The function itself will have its own context with arguments and captures
      function fn(...args) {
        const ctx = Object.create(this, ctxProps);
        for (let i = 0, l = argNames.length; i < l; i++) {
          ctx[argNames[i]] = args[i];
        }
        return run(block, ctx);
      }
      Object.defineProperty(fn, 'length', { value: argNames.length });
      // TODO mark as pure if possible
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
