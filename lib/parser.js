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
    = line*

  value
    = number | string | word | block

  block
    = "{" space+ line* (expression space)? space* "}"

  line
    = expression whitespace+ (comma whitespace*)? comment -- comment
    | expression whitespace* terminator  -- newline


  expression
    = space* nonemptyListOf<value, whitespace+>

  terminator
    = "\n" | comma | end

  comma
    = "," space+

  wrd
    = (~(":" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | "*" | space) any)+

  word
    = "|" wrd "*"? -- pipe
    | "." wrd "*"? -- op
    | "?" wrd      -- get
    | ":" wrd      -- lset
    | wrd ":"      -- set
    | "'" wrd      -- lit
    | wrd          -- normal

  string
  	= "\"" ("\\\"" | ~"\"" any)* "\""
    | "\"\"\"" (~"\"\"\"" any)* "\"\"\""

  whitespace
  	= ~"\n" space

  comment
    = ";" (~"\n" any)* ("\n" | end)

  number
    = "0" caseInsensitive<"x"> (digit | "a".."f" | "A".."F")+ -- hex
    | digit* "." digit+ ("e" "-"? digit+)?                    -- exp
    | digit+                                                  -- dec
}`);

const ryeSemantics = ryeGrammar.createSemantics();

ryeSemantics.addOperation('toAST', {
  _iter: (...children) => children.flatMap((child) => child.toAST()),
  program: (lines) => lines.toAST(),
  line_comment: (expression, _, comma, __, _comment) => {
    const exp = expression.toAST();
    exp.push(new AST.Terminator(!!comma.sourceString.trim()));
    return exp;
  },
  line_newline: (expression, _, terminator) => {
    const exp = expression.toAST();
    exp.push(new AST.Terminator(!!terminator.sourceString.trim()));
    return exp;
  },
  expression: (_, values) => {
    return values.asIteration().children.flatMap((value) => value.toAST());
  },
  block: (_open, _, lines, expression, __, ___, _close) => {
    const exp = lines.toAST();
    const last = expression.toAST();
    if (last.length > 0) {
      exp.push(...last);
    }
    return new AST.Block(exp);
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
  word_pipe: (_, value, star) => {
    return new AST.PipeWord(value.toAST(), !!star.sourceString.trim());
  },
  word_op: (_, value, star) => {
    return new AST.OpWord(value.toAST(), !!star.sourceString.trim());
  },
  word_get: (_, value) => {
    return new AST.GetWord(value.toAST());
  },
  word_lset: (_, value) => {
    return new AST.LSetWord(value.toAST());
  },
  word_set: (value, _) => {
    return new AST.SetWord(value.toAST());
  },
  word_lit: (_, value) => {
    return new AST.LitWord(value.toAST());
  },
  word_normal: (value) => {
    return new AST.Word(value.toAST());
  },
  wrd: (value) => {
    return value.sourceString;
  },
});