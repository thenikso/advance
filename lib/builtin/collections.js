import { run } from '../run.js';
import { isWord, isLiteral } from '../ast.js';

export default function builtin(declareFn) {
  declareFn(
    'get', // NOTE was _->
    function getArrow(data, key) {
      if (data instanceof Map) {
        return data.get(key);
      }
      if (data instanceof Object) {
        return data[key];
      }
      throw new Error('Invalid data type for get');
    },
    false,
  );

  declareFn(
    'dict',
    function dict(block) {
      const obj = {};
      let k, v;
      for (let i = 0, l = block.length; i < l; ) {
        k = block[i];
        if (isWord(k)) {
          if (k.kind === 'set' || k.kind === 'normal') {
            k = k.word;
          } else if (k.kind === 'lit') {
            k = Symbol.for(k.word);
          } else {
            continue;
          }
        } else if (!isLiteral(k)) {
          continue;
        }
        v = run(block, this, undefined, i + 1, true);
        i = v.index;
        obj[k] = v.value;
      }
      return obj;
    },
    false,
  );

  declareFn(
    'list',
    function list(block) {
      const res = [];
      let v;
      for (let i = 0, l = block.length; i < l; ) {
        v = run(block, this, undefined, i, true);
        i = v.index;
        res.push(v.value);
      }
      return res;
    },
    true,
  );
}
