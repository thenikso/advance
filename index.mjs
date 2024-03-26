// @ts-check

import { grammar } from './dist/ohm.js';

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
