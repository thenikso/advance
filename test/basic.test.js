import { describe, testUtils } from './runner/index.mjs';
import { defaultContext } from '../lib/index.js';

describe('basic', (assert) => {
  const { assertReturn, assertLogs } = testUtils(defaultContext, assert, {
    showTime: true,
  });

  assertLogs('print "Hello, World!"', ['Hello, World!']);

  assertLogs(
    `{ 7 4 12 21 } .with {
      .max .printv "Max: {}" ,
      .min .printv "Min: {}" ,
      .avg .printv "Avg: {}" ,
      print "---------" ,
      .sum .printv "Sum: {}"
    }`,
    [],
  );
});
