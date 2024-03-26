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

export function testUtils(context, assert, defaultOptions) {
  let currentContext = null;

  let currentLogs = [];
  const { showTime: defaultShowTime = false } = defaultOptions ?? {};

  const createContext = () => {
    const ctx = context.createChild();
    ctx.fn('print', (s) => currentLogs.push(s));
    ctx.fn('printv', (v, s) => currentLogs.push(s.replace('{}', v)));
    return ctx;
  };

  return {
    assertReturn(code, ret, options) {
      const { showTime = defaultShowTime } = options ?? {};
      const startTime = showTime ? performance.now() : 0;
      assert({
        given: `\`${code}\``,
        should: `return ${typeof ret === 'string' ? `"${ret}"` : ret}`,
        actual: (currentContext || createContext()).run(code),
        expected: ret,
      });
      if (showTime) {
        const endTime = performance.now();
        console.log(`took ${endTime - startTime}ms`);
      }
    },
    assertError(code, error, options) {
      const { showTime = defaultShowTime } = options ?? {};
      const startTime = showTime ? performance.now() : 0;
      assert({
        given: `\`${code}\``,
        should: `throw "${error}"`,
        actual: (() => {
          let res;
          let err;
          try {
            res = (currentContext || createContext()).run(code);
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
    },
    assertCode(code, expected, options) {
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
    },
    assertLogs(code, logs, options) {
      const { showTime = defaultShowTime, mapLogs } = options ?? {};
      logs = Array.isArray(logs) ? logs : [logs];
      const startTime = showTime ? performance.now() : 0;
      assert({
        given: `\`${code}\``,
        should: `log ${logs.map((l) => `"${l}"`).join(', ')}`,
        actual: (() => {
          currentLogs = [];
          (currentContext ?? createContext()).run(code);
          return mapLogs ? mapLogs(currentLogs) : currentLogs;
        })(),
        expected: logs,
      });
      if (showTime) {
        const endTime = performance.now();
        console.log(`took ${endTime - startTime}ms`);
      }
    },
    withContext(fn, ctx) {
      currentContext = ctx ?? createContext();
      fn(currentContext);
      currentContext = null;
    },
  };
}
