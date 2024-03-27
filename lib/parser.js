// @ts-check

import { grammar } from '../dist/ohm.js';
import * as AST from './ast.js';

/**
 * @typedef {import('./ast.js').Expression} Expression
 */

/**
 * Parse the given code into an AST
 * @param {string} code The code to parse
 * @returns {Expression}
 */
export function parse(code) {
  const match = ryeGrammar.match(code);
  if (match.failed()) {
    throw new Error(match.message);
  }

  return ryeSemantics(match).toAST();
}

/** @type {import('ohm-js').Grammar} */
const ryeGrammar = grammar(String.raw`Rye {
  program
    = line* space*

  value
    = number | string | boolean | word | operator | block

  block
    = "{" space+ line* (expression space)? space* "}"

  line
    = expression whitespace+ (comma whitespace*)? comment -- wcomment
    | expression whitespace* terminator  -- newline
    | space* comment -- comment


  expression
    = space* nonemptyListOf<value, whitespace+>

  terminator
    = "\n" | comma | end

  comma
    = "," space+

  wrd
    = letter ("-" | "?" | "=" | "." | "\\" | "!" | "_" | "+" | "<" | ">" | alnum)*
    | "_" op

  word
    = "|" wrd "*"?   -- pipe
    | "." wrd "*"?   -- op
    | "?" wrd        -- get
    | ":" wrd        -- lset
    | wrd ":"        -- set
    | "'" wrd        -- lit
    | wrd ("/" wrd)+ -- cpath
    | wrd            -- normal

  op
    = (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space | alnum | "_") any)+

  operator
    = "|" op -- pipe
    | op     -- normal

  string
  	= "\"" ("\\\"" | ~"\"" any)* "\""

  whitespace
  	= ~"\n" space

  comment
    = ";" (~"\n" any)* ("\n" | end)

  number
    = "0" caseInsensitive<"x"> (digit | "a".."f" | "A".."F")+ -- hex
    | digit* "." digit+ ("e" "-"? digit+)?                    -- exp
    | digit+                                                  -- dec

  boolean
    = "true"
    | "false"
}`);

const ryeSemantics = ryeGrammar.createSemantics();

ryeSemantics.addOperation('toAST', {
  _iter: (...children) => children.flatMap((child) => child.toAST()),
  program: (lines, _) => lines.toAST(),
  line_wcomment: (expression, _, comma, __, _comment) => {
    const exp = expression.toAST();
    exp.push(new AST.Terminator(!!comma.sourceString.trim()));
    return exp;
  },
  line_newline: (expression, _, terminator) => {
    const exp = expression.toAST();
    exp.push(new AST.Terminator(!!terminator.sourceString.trim()));
    return exp;
  },
  line_comment: (_, _comment) => {},
  expression: (_, values) => {
    return values.asIteration().children.map((value) => value.toAST());
  },
  block: (_open, _, lines, expression, __, ___, _close) => {
    const exp = lines.toAST();
    const last = expression.toAST();
    if (last.length > 0) {
      exp.push(...last);
    }
    const block = new AST.Block();
    block.push(...exp);
    return block;
  },
  number: (value) => {
    switch (value.ctorName.substring(7)) {
      case 'hex':
        return parseInt(value.sourceString, 16);
      case 'exp':
        return parseFloat(value.sourceString);
      default:
        return parseInt(value.sourceString, 10);
    }
  },
  string: (_, value, __) => {
    return value.sourceString;
  },
  boolean: (value) => {
    return value.sourceString === 'true';
  },
  word_pipe: (_, value, star) => {
    return new AST.PipeWord(value.sourceString, !!star.sourceString.trim());
  },
  word_op: (_, value, star) => {
    return new AST.OpWord(value.sourceString, !!star.sourceString.trim());
  },
  word_get: (_, value) => {
    return new AST.GetWord(value.sourceString);
  },
  word_lset: (_, value) => {
    return new AST.LSetWord(value.sourceString);
  },
  word_set: (value, _) => {
    return new AST.SetWord(value.sourceString);
  },
  word_lit: (_, value) => {
    return new AST.LitWord(value.sourceString);
  },
  word_cpath: (w1, _, wds) => {
    return new AST.CPathWord(
      w1.sourceString,
      ...wds.children.map((c) => c.sourceString),
    );
  },
  word_normal: (value) => {
    return new AST.Word(value.sourceString);
  },
  operator_pipe: (_, value) => {
    return new AST.PipeWord('_' + value.sourceString);
  },
  operator_normal: (value) => {
    return new AST.OpWord('_' + value.sourceString);
  },
});
