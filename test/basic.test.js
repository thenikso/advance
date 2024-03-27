import { describe, testUtils } from './runner/index.mjs';
import { createContext } from '../lib/index.js';

describe('basic', (assert) => {
  const { assertReturn, assertLogs } = testUtils(createContext(), assert, {
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

  assertLogs(
    `word: "apple"
    str: "did snake eat the apple?"
    word .replace* str "****" |print`,
    ['did snake eat the ****?'],
  );

  assertReturn(`12 + 21 :apples + 100 :fruits`, 133);
});
