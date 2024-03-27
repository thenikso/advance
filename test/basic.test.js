import { describe, testUtils } from './runner/index.mjs';
import { defaultContext } from '../lib/index.js';

describe('basic', (assert) => {
  const { assertReturn, assertLogs } = testUtils(defaultContext, assert, {
    showTime: false,
  });

  assertLogs('print "Hello, World!"', ['Hello, World!']);

  assertLogs('print 10 .inc', ['11']).andReturn(11);

  assertLogs(
    `{ 7 4 12 21 } .with {
      .max .printv "Max: {}" ,
      .min .printv "Min: {}" ,
      .avg .printv "Avg: {}" ,
      print "---------" ,
      .sum .printv "Sum: {}"
    }`,
    ['Max: 21', 'Min: 4', 'Avg: 11', '---------', 'Sum: 44'],
  ).andReturn(44);

  assertLogs(`x: "hello" y: "word" print x y`, ['hello']).andReturn('word');

  assertLogs(`inc 4 :x print x`, ['5']).andReturn(5);

  assertLogs(`inc 14 .print |print`, ['14', '15']);
});
