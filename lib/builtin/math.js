export default function builtin(ctx, declareFn) {
  declareFn(
    ctx,
    '#+',
    function add(a, b) {
      return a + b;
    },
    true,
  );

  declareFn(
    ctx,
    '#-',
    function sub(a, b) {
      return a - b;
    },
    true,
  );

  declareFn(
    ctx,
    '#*',
    function mul(a, b) {
      return a * b;
    },
    true,
  );

  declareFn(
    ctx,
    '#/',
    function div(a, b) {
      return a / b;
    },
    true,
  );

  declareFn(
    ctx,
    '#<',
    function lt(a, b) {
      return a < b;
    },
    true,
  );

  declareFn(
    ctx,
    '#>',
    function gt(a, b) {
      return a > b;
    },
    true,
  );

  declareFn(
    ctx,
    '#=',
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
