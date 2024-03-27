export default function builtin(ctx, declareFn) {
  declareFn(
    ctx,
    'print',
    function print(v) {
      console.log(v?.toString?.() ?? v);
      return v;
    },
    false,
  );

  declareFn(
    ctx,
    'printv',
    function printv(v, fmt) {
      console.log(fmt.replace('{}', v));
      return v;
    },
    false,
  );
}
