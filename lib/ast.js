// @ts-check

/**
 * @typedef {Word | Block | List | string | number | boolean} Value
 */

/**
 * @typedef {[Value | Terminator]} Expression
 */

export class Word {
  /**
   * @param {string} word
   */
  constructor(word) {
    /** @type {symbol} */
    this.word = Symbol.for(word);
  }

  get type() {
    return 'word';
  }

  get kind() {
    return 'normal';
  }

  toString() {
    return `[${this.constructor.name}: ${Symbol.keyFor(this.word)}]`;
  }
}

export class PipeWord extends Word {
  constructor(word, star) {
    super(word);
    this.star = star;
  }

  get kind() {
    return 'pipe';
  }
}

export class OpWord extends Word {
  constructor(word, star) {
    super(word);
    this.star = star;
  }

  get kind() {
    return 'op';
  }
}

export class GetWord extends Word {
  get kind() {
    return 'get';
  }
}

export class LSetWord extends Word {
  get kind() {
    return 'lset';
  }
}

export class SetWord extends Word {
  get kind() {
    return 'set';
  }
}

export class LitWord extends Word {
  get kind() {
    return 'lit';
  }
}

export class CPathWord extends Word {
  /**
   * @param {string[]} path
   */
  constructor(...path) {
    super(path[0]);
    this.path = path.map((p) => Symbol.for(p));
  }

  get kind() {
    return 'cpath';
  }

  toString() {
    return `[${this.constructor.name}: ${this.path.join('.')}]`;
  }
}

export class Block extends Array {
  get type() {
    return 'block';
  }
}

export class List extends Array {
  get type() {
    return 'list';
  }
}

export class Terminator {
  /**
   * @param {boolean} comma
   */
  constructor(comma) {
    this.comma = comma;
  }

  get type() {
    return 'terminator';
  }
}

/**
 * @param {any[]} exp
 * @returns {string}
 */
export function printExpression(exp) {
  let res = '';
  for (let i = 0; i < exp.length; i++) {
    const node = exp[i];
    if (isWord(node)) {
      switch (node.kind) {
        case 'set':
          res += Symbol.keyFor(node.word) + ':';
          break;
        case 'lset':
          res += ':' + Symbol.keyFor(node.word);
          break;
        case 'normal':
          res += Symbol.keyFor(node.word);
          break;
        case 'lit':
          res += "'" + Symbol.keyFor(node.word);
          break;
        case 'cpath':
          res += node.path.map(Symbol.keyFor).join('.');
          break;
        case 'pipe':
          res += '|' + Symbol.keyFor(node.word);
          break;
        case 'op':
          {
            const opword = Symbol.keyFor(node.word);
            if (opword?.startsWith('#')) {
              res += opword.substring(1);
            } else {
              res += '.' + opword;
            }
          }
          break;
        case 'get':
          res += '?' + Symbol.keyFor(node.word);
          break;
      }
    } else if (isTerminator(node)) {
      if (node.comma) {
        res += ',';
      } else {
        continue;
      }
    } else {
      res += String(node);
    }
    res += ' ';
  }
  return res.trim();
}

/**
 * @param {any} node
 * @returns {node is Word & OpWord & CPathWord}
 */
export function isWord(node) {
  return node?.type === 'word';
}

/**
 * @param {any} node
 * @returns {node is Block}
 */
export function isBlock(node) {
  return node?.type === 'block';
}

/**
 * @param {any} node
 * @returns {node is List}
 */
export function isList(node) {
  return node?.type === 'list';
}

/**
 * @param {any} node
 * @returns {node is Terminator}
 */
export function isTerminator(node) {
  return node?.type === 'terminator';
}

/**
 * @param {any} node
 * @returns {node is string | number | boolean}
 */
export function isLiteral(node) {
  return (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean'
  );
}
