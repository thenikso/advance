#!/usr/bin/env node

import nodeRepl from 'repl';
import chalk from 'chalk';
import minimist from 'minimist';
import path from 'path';
import fs from 'fs/promises';
import * as advance from './index.mjs';

const argv = minimist(process.argv.slice(2), {
  '--': true,
});

switch (argv._[0]) {
  case 'repl':
  case undefined:
    repl();
    break;
  default:
    run(argv._[0]);
    break;
}

function repl() {
  const replServer = nodeRepl.start({
    prompt: chalk.greenBright('⟩ '),
    useColors: true,
    useGlobal: false,
    preview: true,
    eval: function (cmd, replContext, filename, callback) {
      try {
        const res = advance.exec(cmd, replContext._advContext);
        callback(null, res);
      } catch (err) {
        callback(err);
      }
    },
    completer: function (line) {
      const completions = [];
      let ctx = replServer.context._advContext;
      while (ctx) {
        completions.push(
          ...Object.getOwnPropertySymbols(ctx).map(Symbol.keyFor),
        );
        ctx = Object.getPrototypeOf(ctx);
      }
      const word = line.substring(line.lastIndexOf(' ') + 1);
      const hits = completions.filter((c) => c.startsWith(word));
      return [hits.length ? hits : completions, word];
    },
  });

  resetContext(replServer.context);
  replServer.on('reset', resetContext);

  function resetContext(replContext) {
    replContext._advContext = advance.createContext();
  }
}

async function run(filePath) {
  const fullPath = path.resolve(filePath);
  const source = await fs.readFile(fullPath, 'utf-8');
  const res = advance.exec(source);
  return res;
}
