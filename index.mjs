// @ts-check

import { createContext } from './lib/index.js';

export function rye(strings, ...values) {
  let code = '';
  for (let i = 0; i < strings.length; i++) {
    code += strings[i];
    if (i < values.length) {
      code += values[i];
    }
  }
  return createContext()[Symbol.for('eval')](code);
}
