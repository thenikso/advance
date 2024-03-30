import { parse } from '../parser.js';
import { run } from '../run.js';

export default function builtin(ctx, declareFn) {
  declareFn(ctx, {
    name: 'import',
    pure: false,
    fn: async function importFn(path) {
      const code = await fetch(path).then((res) => res.text());
      const ast = parse(code);
      return run(ast, this);
    },
  });

  declareFn(ctx, {
    name: 'print',
    fn: function print(v) {
      console.log(v?.toString?.() ?? v);
      return v;
    },
    pure: false,
  });

  declareFn(ctx, {
    name: 'printv',
    fn: function printv(v, fmt) {
      console.log(fmt.replace('{}', v));
      return v;
    },
    pure: false,
  });
}
