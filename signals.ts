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
  signal.value = newValue;

  for (let listener of signal.listeners) {
    listener(signal.value);
  }
}

export function effect(callback: () => void) {
  startTracking();
  callback();
  let signals = stopTracking();
  for (let signal of signals) {
    signal.listeners.add(callback);
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
