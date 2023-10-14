export interface Signal<T> {
  writeable: boolean;
  value: T;
  listeners: Set<(value: T) => void>;
}

export interface WritableSignal<T> extends Signal<T> {
  writeable: true;
}

export interface ReadonlySignal<T> extends Signal<T> {
  writeable: false;
}

let cursors: number[] = [];
let trackedSignals: Signal<any>[] = [];
let transactionDepth = 0;
let rollbackCursors: number[] = [];
let rollbacks: (() => void)[] = [];
let scheduledEffectCursors: number[] = [];
let scheduledEffectCallbacks: (() => void)[] = [];

function startTracking() {
  cursors.push(trackedSignals.length);
}

function stopTracking() {
  let prevCursor = cursors.pop()!;
  let signals = trackedSignals.slice(prevCursor);
  trackedSignals.length = prevCursor;
  return signals;
}

export function signal<T>(initialValue: T): WritableSignal<T> {
  return {
    writeable: true,
    value: initialValue,
    listeners: new Set(),
  };
}

export function get<T>(signal: Signal<T>): T {
  trackedSignals.push(signal);
  return signal.value;
}

export function set<T>(signal: WritableSignal<T>, newValue: T) {
  if (transactionDepth) {
    let prevValue = signal.value;
    rollbacks.unshift(() => {
      signal.value = prevValue;
      notify(signal);
    });
  }

  signal.value = newValue;
  notify(signal);
}

function notify<T>(signal: Signal<T>) {
  for (let listener of signal.listeners) {
    listener(signal.value);
  }
}

export function effect(callback: () => void) {
  startTracking();
  callback();
  let signals = stopTracking();

  for (let signal of signals) {
    signal.listeners.add(() => {
      if (transactionDepth) {
        scheduledEffectCallbacks.push(callback);
      } else {
        callback();
      }
    });
  }
}

export function computed<T>(producer: () => T): ReadonlySignal<T> {
  startTracking();
  let initialValue = producer();
  let dependencies = stopTracking();

  let signal: ReadonlySignal<T> = {
    writeable: false,
    value: initialValue,
    listeners: new Set(),
  };

  function recompute() {
    signal.value = producer();
  }

  for (let dependency of dependencies) {
    dependency.listeners.add(recompute);
  }

  return signal;
}

function rollback() {
  let rollbackCursor = rollbackCursors.pop()!;
  let currentRollbacks = rollbacks.slice(rollbackCursor);
  rollbacks.length = rollbackCursor;
  for (let rollback of currentRollbacks) {
    rollback();
  }
}

function runScheduledEffects() {
  let prevEffectCursor = scheduledEffectCursors.pop()!;
  let callbacks = scheduledEffectCallbacks.slice(prevEffectCursor);
  for (let callback of callbacks) {
    callback();
  }
  scheduledEffectCallbacks.length = prevEffectCursor;
}

export function transact(callback: (rollback: () => void) => void) {
  try {
    transactionDepth += 1;
    rollbackCursors.push(rollbacks.length);
    scheduledEffectCursors.push(scheduledEffectCallbacks.length);
    callback(rollback);
    runScheduledEffects();
  } catch (err) {
    rollback();
    throw err;
  } finally {
    transactionDepth -= 1;
  }
}
