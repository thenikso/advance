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

  assertLogs(`loop 3 { :i , print i } `, ['1', '2', '3']).andReturn(3);

  assertLogs(`if 10 < 20 { print "Hello" }`, ['Hello']);

  assertLogs(`either 0 { print "hello" } { print "yello" }`, ['yello']);

  assertLogs(`switch 2 { 1 { print "one" } 2 { print "two" } }`, ['two']);

  assertLogs(`2 :two switch 2 { 1 { print "one" } two { print "two" } }`, ['two']);
});
