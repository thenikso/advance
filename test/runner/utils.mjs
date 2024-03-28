export async function loadFile(filePath) {
  if (typeof window !== 'undefined') {
    const res = await fetch(filePath);
    return res.text();
  }
  const fs = await import('fs/promises');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return fs.readFile(path.resolve(__dirname, '..', filePath), 'utf8');
}

const evalWord = Symbol.for('eval');

export function testUtils(context, assert, defaultOptions) {
  let currentContext = null;

  let currentLogs = [];
  const { showTime: defaultShowTime = false } = defaultOptions ?? {};

  const createContext = () => {
    const ctx = Object.create(context, {
      [Symbol.for('print')]: {
        value: (s) => {
          currentLogs.push(s?.toString?.() ?? s);
          return s;
        },
        writable: false,
      },
      [Symbol.for('printv')]: {
        value: (v, s) => {
          currentLogs.push(s.replace('{}', v));
          return v;
        },
        writable: false,
      },
    });
    return ctx;
  };

  function assertReturn(code, ret, options) {
    const { showTime = defaultShowTime, given } = options ?? {};
    const startTime = showTime ? performance.now() : 0;
    assert({
      given: given ?? `\`${code}\``,
      should: `return ${typeof ret === 'string' ? `"${ret}"` : String(ret)}`,
      actual: (currentContext || createContext())[evalWord](code),
      expected: ret,
    });
    if (showTime) {
      const endTime = performance.now();
      console.log(`took ${endTime - startTime}ms`);
    }
    return {
      andLog: (logs) =>
        assertLogs(code, logs, { ...options, given: 'the above' }),
    };
  }

  function assertError(code, error, options) {
    const { showTime = defaultShowTime } = options ?? {};
    const startTime = showTime ? performance.now() : 0;
    assert({
      given: `\`${code}\``,
      should: `throw "${error}"`,
      actual: (() => {
        let res;
        let err;
        try {
          res = (currentContext || createContext())[evalWord](code);
        } catch (e) {
          err = e;
        }
        return err?.message ?? res;
      })(),
      expected: error,
    });
    if (showTime) {
      const endTime = performance.now();
      console.log(`took ${endTime - startTime}ms`);
    }
  }

  function assertCode(code, expected, options) {
    const { showTime = defaultShowTime } = options ?? {};
    const startTime = showTime ? performance.now() : 0;
    assert({
      given: `\`${code}\``,
      should: `parse as \`${expected}\``,
      actual: (currentContext || createContext()).parse(code).toString(),
      expected,
    });
    if (showTime) {
      const endTime = performance.now();
      console.log(`took ${endTime - startTime}ms`);
    }
  }

  function assertLogs(code, logs, options) {
    const { showTime = defaultShowTime, mapLogs, given } = options ?? {};
    logs = Array.isArray(logs) ? logs : [logs];
    const startTime = showTime ? performance.now() : 0;
    assert({
      given: given ?? `\`${code}\``,
      should: `log ${logs.map((l) => `"${l}"`).join(', ')}`,
      actual: (() => {
        currentLogs = [];
        (currentContext ?? createContext())[evalWord](code);
        return mapLogs ? mapLogs(currentLogs) : currentLogs;
      })(),
      expected: logs,
    });
    if (showTime) {
      const endTime = performance.now();
      console.log(`took ${endTime - startTime}ms`);
    }
    return {
      andReturn: (ret) =>
        assertReturn(code, ret, { ...options, given: 'the above' }),
    };
  }

  function withContext(fn, ctx) {
    currentContext = ctx ?? createContext();
    fn(currentContext);
    currentContext = null;
  }

  return {
    assertReturn,
    assertError,
    assertCode,
    assertLogs,
    withContext,
  };
}
