import builtinCore from './core.js';
import builtinMath from './math.js';
import builtinCollections from './collections.js';
import buildinValidation from './validation.js';
import builtinBrowser from './browser.js';

export default function builtin(ctx, declareFn) {
  builtinCore(ctx, declareFn);
  builtinMath(ctx, declareFn);
  builtinCollections(ctx, declareFn);
  buildinValidation(ctx, declareFn);
  // TODO load browser builtins only if in browser environment
  builtinBrowser(ctx, declareFn);
  // TODO load node builtins only if in node environment
}
