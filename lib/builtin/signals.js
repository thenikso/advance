// @ts-check
import { run } from '../run.js';

const IsSignal = Symbol('IsSignal');

export function isSignal(value) {
  return value?.[IsSignal] === true;
}

const IsWatcher = Symbol('IsWatcher');

export function isWatcher(value) {
  return value?.[IsWatcher] === true;
}

export function isSignalOrWatcher(value) {
  return isSignal(value) || isWatcher(value);
}

const WatcherSetup = Symbol('WatcherSetup');

const valueSymbol = Symbol.for('value');
const setValueSymbol = Symbol.for('setValue');
const stopSymbol = Symbol.for('stop');

export function signalValue(signal) {
  return signal?.[valueSymbol].call(this);
}

/**
 * Can be used to set a word in a context as a signal.
 * Only works if the value is a Signal. Returns false otherwise.
 * @param {Object} ctx
 * @param {symbol} word
 * @param {any} value
 * @returns {boolean}
 */
export function setWordAsSignalIfNeeded(ctx, word, value) {
  if (value?.[IsSignal] !== true) return false;
  Object.defineProperty(ctx, word, {
    get() {
      return value;
    },
    set(newValue) {
      value[setValueSymbol].call(this, newValue);
      return newValue;
    },
    enumerable: true,
    configurable: true,
  });
  return true;
}

function makeSignal(initialValue) {
  // FIX make some of these Sets weak?
  // FIX batch updates to watchers on timeout or next tick
  // When the signal is updated, all watchers using it are updated
  const watchersUpdate = new Set();
  const addWatcherUpdate = (watcher) => {
    if (watcher) {
      watchersUpdate.add(watcher);
    }
  };
  const removeWatcherUpdate = (watcher) => {
    watchersUpdate.delete(watcher);
  };
  const onUpdate = (newValue, oldValue) => {
    for (const updateWatcher of watchersUpdate) {
      updateWatcher(newValue, oldValue);
    }
  };
  // The signal is an object with a value and a setValue method
  // The `run` loop will automatically resolve signals to their value
  // unless they are accessed via the get word (ie. `?a-signal`)
  let value = initialValue;
  const signal = Object.create(null, {
    [IsSignal]: {
      get() {
        return true;
      },
    },
    [valueSymbol]: {
      value() {
        addWatcherUpdate(this[WatcherSetup]?.(removeWatcherUpdate));
        return value;
      },
      enumerable: true,
    },
    [setValueSymbol]: {
      value(newValue) {
        if (newValue !== value) {
          const oldValue = value;
          value = newValue;
          onUpdate(newValue, oldValue);
        }
        return value;
      },
      enumerable: true,
    },
  });
  return signal;
}

function makeWatch(block) {
  const ctx = this;
  // Watchers can be added to other watchers and behave like signals
  // therefore they also save a list of watchers that depend on them
  const watchersUpdate = new Set();
  const addWatcherUpdate = (watcher) => {
    if (watcher) {
      watchersUpdate.add(watcher);
    }
  };
  const removeWatcherUpdate = (watcher) => {
    watchersUpdate.delete(watcher);
  };
  // Signals used by the watcher are saved in a set.
  // If the watcher is stopped, it will remove itself from the signals
  const signalsRemoveWatcherUpdate = new Set();
  const update = () => {
    const oldValue = computedValue;
    computedValue = run(block, ctx);
    for (const updateWatcher of watchersUpdate) {
      updateWatcher(computedValue, oldValue);
    }
  };
  const setupCtx = Object.create(ctx, {
    [WatcherSetup]: {
      value(removeWatcher) {
        signalsRemoveWatcherUpdate.add(removeWatcher);
        return update;
      },
    },
  });
  // The block is ran once to get the initial value in a special context
  // that allows the signals used in the block to add the watcher to their set
  let computedValue = run(block, setupCtx);
  // Watchers are computed values that are updated when their dependencies change
  const watcher = Object.create(null, {
    [IsWatcher]: {
      get() {
        return true;
      },
    },
    [valueSymbol]: {
      value() {
        addWatcherUpdate(this[WatcherSetup]?.(removeWatcherUpdate));
        return computedValue;
      },
      enumerable: true,
    },
    [stopSymbol]: {
      value() {
        for (const removeWatcherUpdate of signalsRemoveWatcherUpdate) {
          removeWatcherUpdate(update);
        }
        signalsRemoveWatcherUpdate.clear();
        return true;
      },
      enumerable: true,
    },
  });
  return watcher;
}

export default function builtin(ctx, declareFn) {
  declareFn(ctx, {
    name: 'is-signal',
    pure: true,
    fn: isSignal,
  });

  declareFn(ctx, {
    name: 'is-watch',
    pure: true,
    fn: isWatcher,
  });

  declareFn(ctx, {
    name: 'signal',
    pure: false,
    fn: function signalFn(initialValue) {
      // NOTE if set with a set word (ie. `a: signal 42` or 'signal 42 :a')
      // the runtime will use `setWordAsSignalIfNeeded` and make the user not
      // need to call `a/value` or `a/setValue` to get or set the value.
      return makeSignal.call(this, initialValue);
    },
  });

  declareFn(ctx, {
    name: 'watch',
    pure: false,
    fn: function watchFn(block) {
      return makeWatch.call(this, block);
    },
  });
}
