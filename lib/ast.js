// @ts-check

/**
 * @typedef {Word | Block | string | number} Value
 */

/**
 * @typedef {[Value | Terminator]} Expression
 */

export class Word {
  /**
   * @param {string} word
   */
  constructor(word) {
    // TODO use Symbol.for('word') instead of 'word'?
    this.word = word;
  }

  get type() {
    return 'word';
  }

  get kind() {
    return 'normal';
  }

  toString() {
    return `[${this.constructor.name}: ${this.word}]`;
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

export class Block extends Array {
  get type() {
    return 'block';
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
 * @returns {node is OpWord}
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
 * @returns {node is Terminator}
 */
export function isTerminator(node) {
  return node?.type === 'terminator';
}
