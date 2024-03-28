export default function builtin(ctx, declareFn) {
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
