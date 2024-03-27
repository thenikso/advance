import { run } from '../run.js';

export default function builtin(defaultContext, declareFn) {
  declareFn(
    defaultContext,
    'validate',
    function validate(dict, validationBlock) {
      const validator = validationContext.dict(validationBlock);
      const res = {};
      let isMap = false;
      if (dict instanceof Map) {
        isMap = true;
      } else if (typeof dict !== 'object') {
        throw new Error('Value must be an object or a map');
      }
      for (const [key, val] of validator.entries()) {
        res[key] = val(isMap ? dict.get(key) : dict[key]);
      }
      return res;
    },
    false,
  );

  const validationContext = Object.create(defaultContext);

  declareFn(
    validationContext,
    'optional',
    function optional(fallback, decoder) {
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
    true,
  );

  declareFn(validationContext, 'required', function required(decoder) {
    return function (value) {
      if (value === undefined) {
        throw new Error('Value is required');
      }
      return decoder(value);
    };
  });

  declareFn(
    validationContext,
    'check',
    function check(message, predicateBlock) {
      return function (value) {
        if (!run(predicateBlock, defaultContext, value)) {
          throw new Error(message);
        }
        return value;
      };
    },
  );

  declareFn(validationContext, 'calc', function calc(calcBlock) {
    return function (value) {
      return run(calcBlock, defaultContext, value);
    };
  });

  declareFn(validationContext, 'string', function string() {
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
  });

  declareFn(validationContext, 'number', function number() {
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
  });

  declareFn(validationContext, 'boolean', function boolean() {
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
  });

  declareFn(validationContext, 'date', function date() {
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
  });
}
