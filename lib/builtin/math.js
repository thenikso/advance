export default function builtin(ctx, declareFn) {
  declareFn(ctx, {
    name: '#+',
    fn: function add(a, b) {
      return a + b;
    },
    pure: true,
  });

  declareFn(ctx, {
    name: '#-',
    fn: function sub(a, b) {
      return a - b;
    },
    pure: true,
  });

  declareFn(ctx, {
    name: '#*',
    fn: function mul(a, b) {
      return a * b;
    },
    pure: true,
  });

  declareFn(ctx, {
    name: '#/',
    fn: function div(a, b) {
      return a / b;
    },
    pure: true,
  });

  declareFn(ctx, {
    name: '#<',
    fn: function lt(a, b) {
      return a < b;
    },
    pure: true,
  });

  declareFn(ctx, {
    name: '#>',
    fn: function gt(a, b) {
      return a > b;
    },
    pure: true,
  });

  declareFn(ctx, {
    name: '#=',
    fn: function eq(a, b) {
      return a === b;
    },
    pure: true,
  });

  declareFn(ctx, {
    name: 'inc',
    fn: function inc(v) {
      return v + 1;
    },
    pure: true,
  });
}
