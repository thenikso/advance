// @ts-check

/**
 * @typedef {Word | Block | List | string | number | boolean} Value
 */

/**
 * @typedef {[Value | Terminator]} Expression
 */

const WordSymbol = Symbol('Word');
const BlockSymbol = Symbol('Block');
const ListSymbol = Symbol('List');
const TerminatorSymbol = Symbol('Terminator');

export class Word {
  /**
   * @param {string} word
   */
  constructor(word) {
    /** @type {symbol} */
    this.word = Symbol.for(word);
  }

  get type() {
    return WordSymbol;
  }

  get kind() {
    return 'normal';
  }

  toString() {
    return Symbol.keyFor(this.word);
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

  toString() {
    return `|${super.toString()}${this.star ? '*' : ''}`;
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

  toString() {
    let w = super.toString();
    if (w?.startsWith('#')) {
      return w.substring(1);
    }
    return `.${w}${this.star ? '*' : ''}`;
  }
}

export class GetWord extends Word {
  get kind() {
    return 'get';
  }

  toString() {
    return `?${super.toString()}`;
  }
}

export class LSetWord extends Word {
  get kind() {
    return 'lset';
  }

  toString() {
    return `:${super.toString()}`;
  }
}

export class SetWord extends Word {
  get kind() {
    return 'set';
  }

  toString() {
    return `${super.toString()}:`;
  }
}

export class LitWord extends Word {
  get kind() {
    return 'lit';
  }

  toString() {
    return `'${super.toString()}`;
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
    return this.path.map(Symbol.keyFor).join('/');
  }
}

export class Block extends Array {
  get type() {
    return BlockSymbol;
  }

  toString() {
    return `{ ${this.join(' ').trim()} }`;
  }
}

export class List extends Block {
  get type() {
    return ListSymbol;
  }
}

export class Terminator {
  /**
   * @param {boolean} isGuard
   * @param {string=} comment
   */
  constructor(isGuard, comment) {
    /** @type {boolean} */
    this.isGuard = isGuard;
    /** @type {string | undefined} */
    this.comment = comment;
  }

  get type() {
    return TerminatorSymbol;
  }

  toString() {
    return this.isGuard ? ',' : '';
  }
}

/**
 * @param {any} node
 * @returns {node is Word & OpWord & CPathWord}
 */
export function isWord(node) {
  return node?.type === WordSymbol;
}

/**
 * @param {any} node
 * @returns {node is Block}
 */
export function isBlock(node) {
  return node?.type === BlockSymbol;
}

/**
 * @param {any} node
 * @returns {node is List}
 */
export function isList(node) {
  return node?.type === ListSymbol;
}

/**
 * @param {any} node
 * @returns {node is Terminator}
 */
export function isTerminator(node) {
  return node?.type === TerminatorSymbol;
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
