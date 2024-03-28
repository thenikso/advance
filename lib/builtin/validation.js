import { run } from '../run.js';
import { dict } from './collections.js';

export default function builtin(defaultContext, declareFn) {
  declareFn(defaultContext, {
    name: 'validate',
    fn: function validate(block, validationBlock) {
      const validator = dict.call(validationContext, validationBlock);
      const res = {};
      let isMap = false;
      if (block instanceof Map) {
        isMap = true;
      } else if (typeof block !== 'object') {
        throw new Error('Value must be an object or a map');
      }
      for (const [key, val] of validator.entries()) {
        res[key] = val(isMap ? block.get(key) : block[key]);
      }
      return res;
    },
    pure: false,
  });

  const validationContext = Object.create(defaultContext);

  declareFn(validationContext, {
    name: 'optional',
    fn: function optional(fallback, decoder) {
      return function (value) {
        if (value === undefined) {
          return decoder(fallback);
        }
        try {
          return decoder(value);
        } catch (e) {
          return decoder(fallback);
        }
      };
    },
    pure: true,
  });

  declareFn(validationContext, {
    name: 'required',
    fn: function required(decoder) {
      return function (value) {
        if (value === undefined) {
          throw new Error('Value is required');
        }
        return decoder(value);
      };
    },
    pure: true,
  });

  declareFn(validationContext, {
    name: 'check',
    fn: function check(message, predicateBlock) {
      return function (value) {
        if (!run(predicateBlock, defaultContext, value)) {
          throw new Error(message);
        }
        return value;
      };
    },
    pure: true,
  });

  declareFn(validationContext, {
    name: 'calc',
    fn: function calc(calcBlock) {
      return function (value) {
        return run(calcBlock, defaultContext, value);
      };
    },
    pure: false,
  });

  declareFn(validationContext, {
    name: 'string',
    fn: function string() {
      return function (value) {
        if (typeof value === 'number') {
          return String(value);
        }
        if (typeof value === 'boolean') {
          return value ? 'true' : 'false';
        }
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        return value;
      };
    },
    pure: true,
  });

  declareFn(validationContext, {
    name: 'number',
    fn: function number() {
      return function (value) {
        if (typeof value === 'string') {
          const num = Number(value);
          if (Number.isNaN(num)) {
            throw new Error('Value must be a number');
          }
          return num;
        }
        if (typeof value !== 'number') {
          throw new Error('Value must be a number');
        }
        return value;
      };
    },
    pure: true,
  });

  declareFn(validationContext, {
    name: 'boolean',
    fn: function boolean() {
      return function (value) {
        if (typeof value === 'string') {
          if (value === 'true') {
            return true;
          }
          if (value === 'false') {
            return false;
          }
          return Boolean(value);
        }
        if (typeof value === 'number') {
          return value !== 0;
        }
        if (typeof value !== 'boolean') {
          throw new Error('Value must be a boolean');
        }
        return value;
      };
    },
    pure: true,
  });

  declareFn(validationContext, {
    name: 'date',
    fn: function date() {
      return function (value) {
        if (typeof value === 'string') {
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            throw new Error('Value must be a date');
          }
          return date;
        }
        if (typeof value === 'number') {
          return new Date(value);
        }
        if (!(value instanceof Date)) {
          throw new Error('Value must be a date');
        }
        return value;
      };
    },
    pure: true,
  });
}
