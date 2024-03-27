import { run } from '../run.js';

export default function builtin(declareFn, { defaultContext, declareFn: fn }) {
  declareFn(
    'validate',
    function validate(dict, validationBlock) {
      const validator = validationContext.dict(validationBlock);
      const res = {};
      for (const key in validator) {
        res[key] = validator[key](dict[key]);
      }
      return res;
    },
    false,
  );

  const validationContext = Object.create(defaultContext);

  fn(
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

  fn(validationContext, 'required', function required(decoder) {
    return function (value) {
      if (value === undefined) {
        throw new Error('Value is required');
      }
      return decoder(value);
    };
  });

  fn(validationContext, 'check', function check(message, predicateBlock) {
    return function (value) {
      if (!run(predicateBlock, defaultContext, value)) {
        throw new Error(message);
      }
      return value;
    };
  });

  fn(validationContext, 'calc', function calc(calcBlock) {
    return function (value) {
      return run(calcBlock, defaultContext, value);
    };
  });

  fn(validationContext, 'string', function string() {
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

  fn(validationContext, 'number', function number() {
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

  fn(validationContext, 'boolean', function boolean() {
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

  fn(validationContext, 'date', function date() {
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
