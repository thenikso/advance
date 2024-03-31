#!/usr/bin/env node

import nodeRepl from 'node:repl';
import { inspect } from 'node:util';
import chalk from 'chalk';
import minimist from 'minimist';
import path from 'path';
import fs from 'fs/promises';
import * as advance from './index.mjs';

const pkg = await fs.readFile('./package.json', 'utf-8').then(JSON.parse);
console.log(
  `Welcome to Advance v${pkg.version}, Node ${process.version}.\nType ".help" for more information.`,
);

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

const wordModifiers = ["'", '?', '|', '.'];
const prompt = {
  normal: chalk.greenBright('⟩ '),
  multiline: '... ',
};

function repl() {
  let multiline = '';
  const replServer = nodeRepl.start({
    prompt: chalk.greenBright('⟩ '),
    useColors: true,
    useGlobal: false,
    preview: true,
    eval: async function (cmd, replContext, filename, callback) {
      try {
        const res = await advance.exec(
          multiline + cmd,
          replContext._advContext,
        );
        if (multiline) {
          multiline = '';
          replServer.setPrompt(prompt.normal);
        }
        callback(null, res);
      } catch (err) {
        if (err.message.endsWith('Expected "}"')) {
          multiline += cmd + '\n';
          replServer.setPrompt(prompt.multiline);
          callback(nodeRepl.Recoverable(err));
        } else {
          multiline = '';
          replServer.setPrompt(prompt.normal);
          callback(err);
        }
      }
    },
    writer: function (output) {
      if (output instanceof Error) {
        return chalk.redBright(
          output.message.replace('(here)', chalk.bold('(here)')),
        );
      }
      // TODO use a custom inspect function
      return inspect(output, {
        colors: true,
        depth: null,
      });
    },
    completer: function (line) {
      const completions = [];
      // TODO add completions for current context
      // TODO add completions using types if available
      let ctx = replServer.context._advContext;
      while (ctx) {
        completions.push(
          ...Object.getOwnPropertySymbols(ctx).map(Symbol.keyFor),
        );
        ctx = Object.getPrototypeOf(ctx);
      }
      completions.sort();
      let word = line.substring(line.lastIndexOf(' ') + 1);
      if (wordModifiers.includes(word[0])) {
        word = word.substring(1);
      }
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
