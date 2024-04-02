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

class Word {
  /**
   * @param {string[]} word
   */
  constructor(...word) {
    if (word.length < 1) {
      throw new Error('Word must have at least one part');
    }
    /** @type {symbol} */
    this.word = Symbol.for(word[0]);
    /** @type {symbol[] | false} */
    this.path = word.length > 1 && word.map((p) => Symbol.for(p));
  }

  get type() {
    return WordSymbol;
  }

  get isPath() {
    return !!this.path;
  }

  get pathWord() {
    if (this.path) {
      return Symbol.for(this.path.map(Symbol.keyFor).join('/'));
    }
    return this.word;
  }

  toString() {
    if (this.path) {
      return this.path.map(Symbol.keyFor).join('/');
    }
    return Symbol.keyFor(this.word);
  }
}

export class NormalWord extends Word {
  constructor(...word) {
    super(...word);
    /** @type {boolean} */
    this.future = false;
  }

  get kind() {
    return 'normal';
  }

  toString() {
    return `${this.future ? '@' : ''}${super.toString()}`;
  }
}

export class PipeWord extends Word {
  constructor(...word) {
    super(...word);
    /** @type {boolean} */
    this.star = false;
    /** @type {boolean} */
    this.future = false;
  }

  get kind() {
    return 'pipe';
  }

  toString() {
    return `|${this.future ? '@' : ''}${super.toString()}${
      this.star ? '*' : ''
    }`;
  }
}

export class OpWord extends Word {
  constructor(...word) {
    super(...word);
    /** @type {boolean} */
    this.star = false;
    /** @type {boolean} */
    this.future = false;
  }

  get kind() {
    return 'op';
  }

  toString() {
    let w = super.toString();
    if (w?.startsWith('#')) {
      // TODO may not be fully correct with star and future
      return w.substring(1);
    }
    return `.${this.future ? '@' : ''}${w}${this.star ? '*' : ''}`;
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
 * @returns {node is Word & OpWord}
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
