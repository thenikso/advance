// @ts-check

import { grammar } from '../dist/ohm.js';

/**
 * Parse the given code into an AST
 * @param {string} code The code to parse
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
    = "{" space+ line* (expression space+)? "}"

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
    = (~(":" | "[" | "]" | "{" | "}" | "\"" | "," | ";" | space) any)+

  word
    = "|" wrd -- pipe
    | "." wrd -- op
    | "?" wrd -- get
    | ":" wrd -- lset
    | wrd ":" -- set
    | "'" wrd -- lit
    | wrd     -- normal

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
    exp.push({ type: 'terminator', comma: !!comma.sourceString.trim() });
    return exp;
  },
  line_newline: (expression, _, terminator) => {
    const exp = expression.toAST();
    exp.push({ type: 'terminator', comma: !!terminator.sourceString.trim() });
    return exp;
  },
  expression: (_, values) => {
    return values.asIteration().children.flatMap((value) => value.toAST());
  },
  block: (_open, _, lines, expression, __, _close) => {
    const exp = lines.toAST();
    const last = expression.toAST();
    if (last.length > 0) {
      exp.push(...last);
    }
    return {
      type: 'block',
      expression: exp,
    };
  },
  number: (value) => {
    return {
      type: 'number',
      value: value.sourceString,
    };
  },
  string: (_, value, __) => {
    return {
      type: 'string',
      value: value.sourceString,
    };
  },
  word_pipe: (_, value) => {
    return {
      type: 'pipe',
      value: value.toAST(),
    };
  },
  word_op: (_, value) => {
    return {
      type: 'op',
      value: value.toAST(),
    };
  },
  word_get: (_, value) => {
    return {
      type: 'get',
      value: value.toAST(),
    };
  },
  word_lset: (_, value) => {
    return {
      type: 'lset',
      value: value.toAST(),
    };
  },
  word_set: (value, _) => {
    return {
      type: 'set',
      value: value.toAST(),
    };
  },
  word_lit: (_, value) => {
    return {
      type: 'lit',
      value: value.toAST(),
    };
  },
  word_normal: (value) => {
    return {
      type: 'normal',
      value: value.sourceString,
    };
  },
  wrd: (value) => {
    return value.sourceString;
  },
});
