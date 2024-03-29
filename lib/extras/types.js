// @ts-check

// TODO avoid any import, get stuff from arguments { declareFn, createContext, run, parse, isWord, ... }
import { run } from '../run.js';
import { isBlock } from '../ast.js';

/**
 * @typedef {'string'|'number'|'boolean'} TypeDescriptorType
 *
 * @typedef {Object} TypeDescriptor
 * @property {TypeDescriptorType|[TypeDescriptor]} type
 * @property {'list'|'dict'|'fn'|'Block'=} container
 * @property {string=} op An operation to check the value. Can be 'gt', 'lt', 'eq', 'neq', 'gte', 'lte', 'in', 'nin', 'match'
 * @property {any=} value If op is present, this is the value to compare to
 */

export default function builtin(ctx, declareFn) {
  declareFn(ctx, {
    name: 'type',
    pure: true,
    fn: function typeFn(block) {
      const typeContext = Object.create(null);
      declareFn(typeContext, {
        name: 'check',
        pure: true,
        fn: function check(value) {
          const checks = listWithValue.call(typeCheckContext, block, value);
          return checks.every(Boolean);
        },
      });
      declareFn(typeContext, {
        name: 'match',
        pure: true,
        fn: function match(otherType) {
          const typeDescriptors = listWithValue.call(
            typeToMatchContext,
            otherType,
            undefined,
          );
          const typeMatches = listWithValue.call(
            typeMathersContext,
            block,
            typeDescriptors,
          );
          const matches = typeMatches.every(Boolean);
          return { typeDescriptors, typeMatches, matches };
          return matches;
        },
      });
      return typeContext;
    },
  });

  //
  // Type checkers
  //

  /**
   * The context in which to check the types.
   * It is an empty context so that the only useable functions are the ones
   * declared in this file.
   */
  const typeCheckContext = Object.create(null);

  declareFn(typeCheckContext, {
    name: 'string',
    pure: true,
    fn: function string(value) {
      return typeof value === 'string';
    },
  });

  declareFn(typeCheckContext, {
    name: 'number',
    pure: true,
    fn: function number(value) {
      return typeof value === 'number';
    },
  });

  declareFn(typeCheckContext, {
    name: 'boolean',
    pure: true,
    fn: function boolean(value) {
      return typeof value === 'boolean';
    },
  });

  declareFn(typeCheckContext, {
    name: 'list',
    pure: true,
    fn: function list(value, type) {
      return (
        Array.isArray(value) &&
        value.every((v) => runType(type, typeCheckContext, v))
      );
    },
  });

  declareFn(typeCheckContext, {
    name: 'dict',
    pure: true,
    fn: function dict(value, type) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
      }
      if (value instanceof Map) {
        return Array.from(value.values()).every((v) =>
          runType(type, typeCheckContext, v),
        );
      }
      return Object.values(value).every((v) =>
        runType(type, typeCheckContext, v),
      );
    },
  });

  // TODO `block-of` to check if a block has values of a given type(s)
  // TODO `block-in context` to check if a block can be executed in a given context (ie the context provide all names required by the block)
  // TODO `or` to check if a value is one of the given types like `{ .or { .string , .number } }`

  declareFn(typeCheckContext, {
    name: '#>',
    pure: true,
    fn: function gt(value, limit) {
      if (typeof value === 'number') {
        return value > limit;
      }
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length > limit;
      }
      if (value instanceof Map) {
        return value.size > limit;
      }
      if (typeof value === 'object') {
        return Object.keys(value).length > limit;
      }
      return false;
    },
  });

  declareFn(typeCheckContext, {
    name: '<#',
    pure: true,
    fn: function lt(value, limit) {
      if (typeof value === 'number') {
        return value < limit;
      }
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length < limit;
      }
      if (value instanceof Map) {
        return value.size < limit;
      }
      if (typeof value === 'object') {
        return Object.keys(value).length < limit;
      }
      return false;
    },
  });

  //
  // (Internal) type to be matched
  //

  const typeToMatchContext = Object.create(null, {
    [Symbol.for('string')]: {
      value(_value) {
        return {
          type: 'string',
        };
      },
    },
    [Symbol.for('number')]: {
      value(_value) {
        return {
          type: 'number',
        };
      },
    },
    [Symbol.for('boolean')]: {
      value(_value) {
        return {
          type: 'boolean',
        };
      },
    },

    [Symbol.for('list')]: {
      value(_value, type) {
        return {
          ...runType(type, typeToMatchContext, _value),
          container: 'list',
        };
      },
    },
    [Symbol.for('dict')]: {
      value(_value, type) {
        return {
          ...runType(type, typeToMatchContext, _value),
          container: 'dict',
        };
      },
    },
    [Symbol.for('#>')]: {
      value(_value, limit) {
        return {
          type: ['string', 'number'],
          container: ['list', 'dict'],
          op: 'gt',
          value: limit,
        };
      },
    },
    [Symbol.for('<#')]: {
      value(_value, limit) {
        return {
          type: ['string', 'number'],
          container: ['list', 'dict'],
          op: 'lt',
          value: limit,
        };
      },
    },
  });

  //
  // Type matchers
  //

  const typeMathersContext = Object.create(null, {
    [Symbol.for('string')]: {
      value(typeDescriptors) {
        return descriptorsMatches(typeDescriptors, (td) => {
          return isOrIncludes(td.type, 'string');
        });
      },
    },
    [Symbol.for('number')]: {
      value(typeDescriptors) {
        return descriptorsMatches(typeDescriptors, (td) => {
          return isOrIncludes(td.type, 'number');
        });
      },
    },
    [Symbol.for('boolean')]: {
      value(typeDescriptors) {
        return descriptorsMatches(typeDescriptors, (td) => {
          return isOrIncludes(td.type, 'boolean');
        });
      },
    },
    [Symbol.for('list')]: {
      value(typeDescriptors, type) {
        return descriptorsMatches(typeDescriptors, (td) => {
          if (!isOrIncludes(td.container, 'list')) {
            return false;
          }
          return runType(type, typeMathersContext, toTypeDescriptors(td.type));
        });
      },
    },
    [Symbol.for('dict')]: {
      value(typeDescriptors, type) {
        return descriptorsMatches(typeDescriptors, (td) => {
          if (!isOrIncludes(td.container, 'dict')) {
            return false;
          }
          return runType(type, typeMathersContext, toTypeDescriptors(td.type));
        });
      },
    },
    [Symbol.for('#>')]: {
      value(typeDescriptors, limit) {
        return descriptorsMatches(typeDescriptors, (td) => {
          switch (td.op) {
            case 'gt':
              return td.value >= limit;
            case 'lt':
              return td.value <= limit;
            // case 'eq':
            //   return limit === td.value;
            // case 'in':
            //   return td.value.includes(limit);
            // case 'not-in':
            //   return !td.value.includes(limit);
            // case 'match':
            //   return new RegExp(td.value).test(limit);
          }
          if (td.container) {
            const containerMatch = isOrIncludes(td.container, ['list', 'dict']);
            if (!containerMatch) {
              return false;
            }
          }
          const typeMatch = isOrIncludes(td.type, ['string', 'number']);
          if (!typeMatch || !td.op) {
            return typeMatch;
          }
          return true;
        });
      },
    },
    [Symbol.for('<#')]: {
      value(typeDescriptors, limit) {
        return descriptorsMatches(typeDescriptors, (td) => {
          switch (td.op) {
            case 'gt':
              return td.value <= limit;
            case 'lt':
              return td.value >= limit;
            // case 'eq':
            //   return limit === td.value;
            // case 'in':
            //   return td.value.includes(limit);
            // case 'not-in':
            //   return !td.value.includes(limit);
            // case 'match':
            //   return new RegExp(td.value).test(limit);
          }
          if (td.container) {
            const containerMatch = isOrIncludes(td.container, ['list', 'dict']);
            if (!containerMatch) {
              return false;
            }
          }
          const typeMatch = isOrIncludes(td.type, ['string', 'number']);
          if (!typeMatch || !td.op) {
            return typeMatch;
          }
          return true;
        });
      },
    },
  });
}

//
// Helpers
//

function listWithValue(block, inject) {
  if (isBlock(block)) {
    const res = [];
    let v;
    for (let i = 0, l = block.length; i < l; ) {
      v = run(block, this, inject, i, true);
      i = v.index;
      res.push(v.value);
    }
    return res;
  }
  if (Array.isArray(block)) {
    return block;
  }
  throw new Error('Invalid data type for list');
}

function runType(type, ctx, value) {
  if (isBlock(type)) {
    return run(type, ctx, value);
  }
  if (typeof type === 'function') {
    return type(value);
  }
  throw new Error('Invalid type');
}

/**
 * @param {TypeDescriptor[]} typeDescriptors
 * @param {(typeDescriptors)=>boolean} matcher
 * @returns {boolean}
 */
function descriptorsMatches(typeDescriptors, matcher) {
  // let res = typeDescriptors.map(matcher);
  // res = res.filter((x) => x !== undefined);
  // return res.length > 0 && res.every(Boolean);
  return !typeDescriptors.some((d) => matcher(d) === false);
}

/**
 * Check if a type is compatible with another type.
 * @param {string|string[]|undefined} target
 * @param {string|string[]} reference
 * @returns {boolean}
 */
function isOrIncludes(target, reference) {
  if (Array.isArray(reference)) {
    return reference.some((r) => isOrIncludes(target, r));
  }
  if (target === reference) {
    return true;
  }
  if (Array.isArray(target)) {
    return target.includes(reference);
  }
  return false;
}

function toTypeDescriptors(type) {
  if (
    typeof type === 'string' ||
    (Array.isArray(type) && type.every((t) => typeof t === 'string'))
  ) {
    return [{ type }];
  }
  return type;
}
