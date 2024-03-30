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
  const match = advanceGrammar.match(code);
  if (match.failed()) {
    throw new Error(match.message);
  }

  return advanceSemantics(match).toAST();
}

/** @type {import('ohm-js').Grammar} */
const advanceGrammar = grammar(String.raw`advance {
  program
    = line* space*

  value
    = number | string | boolean | word | operator | block | list

  block
    = "{" space+ line* (expression space)? space* "}"

  list
    = "[" space+ line* (expression space)? space* "]"

  line
    = expression whitespace+ (comma whitespace*)? comment -- wcomment
    | expression whitespace* terminator  -- newline
    | space* comment -- comment


  expression
    = space* nonemptyListOf<value, whitespace+>

  terminator
    = "\n" | comma | end

  comma
    = "," space*

  wrd
    = letter ("-" | "?" | "=" | "\\" | "!" | "_" | "+" | "<" | ">" | alnum)*
    | "#" op

  cpath
    = wrd ("/" wrd)*

  word
    = "|" "@"? cpath "*"?   -- pipe
    | "." "@"? cpath "*"?   -- op
    | "?" cpath             -- get
    | ":" cpath             -- lset
    | cpath ":"             -- set
    | "'" cpath             -- lit
    | "@"? cpath            -- normal

  op
    = (~("(" | ")" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space | alnum | "_") any)+

  operator
    = "|" op  -- pipe
    | ~"#" op -- normal

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

const advanceSemantics = advanceGrammar.createSemantics();

advanceSemantics.addOperation('toAST', {
  _iter: (...children) => children.flatMap((child) => child.toAST()),
  program: (lines, _) => lines.toAST(),
  line_wcomment: (expression, _, comma, __, comment) => {
    const exp = expression.toAST();
    exp.push(
      new AST.Terminator(
        !!comma.sourceString.trim(),
        comment.sourceString.substring(1),
      ),
    );
    return exp;
  },
  line_newline: (expression, _, terminator) => {
    const exp = expression.toAST();
    exp.push(new AST.Terminator(!!terminator.sourceString.trim()));
    return exp;
  },
  line_comment: (_, comment) => {
    return new AST.Terminator(false, comment.sourceString.substring(1));
  },
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
  list: (_open, _, lines, expression, __, ___, _close) => {
    const exp = lines.toAST();
    const last = expression.toAST();
    if (last.length > 0) {
      exp.push(...last);
    }
    const list = new AST.List();
    list.push(...exp);
    return list;
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
  cpath: (w1, _, wds) => {
    return [w1.sourceString, ...wds.children.map((c) => c.sourceString)];
  },
  word_pipe: (_, at, cpath, star) => {
    const w = new AST.PipeWord(...cpath.toAST());
    w.star = !!star.sourceString.trim();
    w.future = !!at.sourceString.trim();
    return w;
  },
  word_op: (_, at, cpath, star) => {
    const w = new AST.OpWord(...cpath.toAST());
    w.star = !!star.sourceString.trim();
    w.future = !!at.sourceString.trim();
    return w;
  },
  word_get: (_, cpath) => {
    return new AST.GetWord(...cpath.toAST());
  },
  word_lset: (_, cpath) => {
    return new AST.LSetWord(...cpath.toAST());
  },
  word_set: (cpath, _) => {
    return new AST.SetWord(...cpath.toAST());
  },
  word_lit: (_, cpath) => {
    return new AST.LitWord(...cpath.toAST());
  },
  word_normal: (at, cpath) => {
    const w = new AST.NormalWord(...cpath.toAST());
    w.future = !!at.sourceString.trim();
    return w;
  },
  operator_pipe: (_, value) => {
    return new AST.PipeWord('#' + value.sourceString);
  },
  operator_normal: (value) => {
    return new AST.OpWord('#' + value.sourceString);
  },
});
