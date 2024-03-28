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
    return `[${this.constructor.name}: ${this.word.toString()}]`;
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
    return `[${this.constructor.name}: ${this.path.join('/')}]`;
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
