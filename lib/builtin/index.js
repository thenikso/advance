import { isNode } from '../env.js';
import builtinCore from './core.js';
import builtinMath from './math.js';
import builtinCollections from './collections.js';
import buildinFutures from './futures.js';
import buildinSignals from './signals.js';
import buildinTypes from './types.js';
import buildinValidation from './validation.js';

// TODO conditional imports
import builtinNode from './node.js';
import builtinBrowser from './browser.js';

export default async function builtin(ctx, declareFn) {
  builtinCore(ctx, declareFn);
  builtinMath(ctx, declareFn);
  builtinCollections(ctx, declareFn);
  buildinFutures(ctx, declareFn);
  buildinSignals(ctx, declareFn);
  buildinTypes(ctx, declareFn);
  buildinValidation(ctx, declareFn);
  if (isNode) {
    builtinNode(ctx, declareFn);
  } else {
    builtinBrowser(ctx, declareFn);
  }
}
