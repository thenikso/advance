// @ts-check

import { parse } from './lib/parser.js';

const code = `{ 7 4 12 21 } .with {
  .max .printv "Max: {}" ,
  .min .printv "Min: {}" ,
  .avg .printv "Avg: {}" ,
  print "---------" ,
  .sum .printv "Sum: {}"
}`;

const ast = parse(code);

console.log(ast);
