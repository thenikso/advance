export default function builtin(ctx, declareFn) {
  declareFn(
    ctx,
    '_+',
    function add(a, b) {
      return a + b;
    },
    true,
  );

  declareFn(
    ctx,
    '_-',
    function sub(a, b) {
      return a - b;
    },
    true,
  );

  declareFn(
    ctx,
    '_*',
    function mul(a, b) {
      return a * b;
    },
    true,
  );

  declareFn(
    ctx,
    '_/',
    function div(a, b) {
      return a / b;
    },
    true,
  );

  declareFn(
    ctx,
    '_<',
    function lt(a, b) {
      return a < b;
    },
    true,
  );

  declareFn(
    ctx,
    '_>',
    function gt(a, b) {
      return a > b;
    },
    true,
  );

  declareFn(
    ctx,
    '_=',
    function eq(a, b) {
      return a === b;
    },
    true,
  );

  declareFn(
    ctx,
    'inc',
    function inc(v) {
      return v + 1;
    },
    true,
  );
}
