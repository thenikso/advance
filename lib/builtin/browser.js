export default function builtin(declareFn) {
  declareFn(
    'print',
    function print(v) {
      console.log(v?.toString?.() ?? v);
      return v;
    },
    false,
  );

  declareFn(
    'printv',
    function printv(v, fmt) {
      console.log(fmt.replace('{}', v));
      return v;
    },
    false,
  );
}
