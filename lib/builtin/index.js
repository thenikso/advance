import builtinCore from './core.js';
import builtinMath from './math.js';
import builtinCollections from './collections.js';
import builtinBrowser from './browser.js';
import buildinValidation from './validation.js';

export default function builtin(ctx, declareFn) {
  builtinCore(ctx, declareFn);
  builtinMath(ctx, declareFn);
  builtinCollections(ctx, declareFn);
  builtinBrowser(ctx, declareFn);
  buildinValidation(ctx, declareFn);
}
