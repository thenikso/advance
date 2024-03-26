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
    this.type = 'word';
    this.kind = 'normal';
    this.word = word;
  }

  toString() {
    return `[${this.constructor.name}: ${this.word}]`;
  }
}

export class PipeWord extends Word {
  constructor(word, star) {
    super(word);
    this.type = 'word';
    this.kind = 'pipe';
    this.star = star;
  }
}

export class OpWord extends Word {
  constructor(word, star) {
    super(word);
    this.type = 'word';
    this.kind = 'op';
    this.star = star;
  }
}

export class GetWord extends Word {
  constructor(word) {
    super(word);
    this.type = 'word';
    this.kind = 'get';
  }
}

export class LSetWord extends Word {
  constructor(word) {
    super(word);
    this.type = 'word';
    this.kind = 'lset';
  }
}

export class SetWord extends Word {
  constructor(word) {
    super(word);
    this.type = 'word';
    this.kind = 'set';
  }
}

export class LitWord extends Word {
  constructor(word) {
    super(word);
    this.type = 'word';
    this.kind = 'lit';
  }
}

export class Block {
  /**
   * @param {Expression} values
   */
  constructor(values) {
    this.type = 'block';
    this.values = values;
  }
}

export class Terminator {
  /**
   * @param {boolean} comma
   */
  constructor(comma) {
    this.type = 'terminator';
    this.comma = comma;
  }
}

/**
 * @param {any} node
 * @returns {node is Word}
 */
export function isWord(node) {
  return node.type === 'word';
}

/**
 * @param {any} node
 * @returns {node is Block}
 */
export function isBlock(node) {
  return node.type === 'block';
}

/**
 * @param {any} node
 * @returns {node is Terminator}
 */
export function isTerminator(node) {
  return node.type === 'terminator';
}
