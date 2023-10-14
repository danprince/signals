import { expect, test, mock } from "bun:test";
import { computed, effect, get, set, signal } from "./signals";

test("can read from signals", () => {
  let count = signal(0);
  expect(get(count)).toBe(0);
});

test("can write to signals", () => {
  let count = signal(0);
  set(count, 3);
  expect(get(count)).toBe(3);
});

test("effects", () => {
  let count = signal(0);
  let fn = mock(_ => {});
  effect(() => fn(get(count)));
  set(count, 3);
  set(count, 10);
  expect(fn.mock.calls).toEqual([[0], [3], [10]]);
});

test("computed signals", () => {
  let count = signal(1);
  let doubled = computed(() => get(count) * 2);
  expect(get(doubled)).toBe(2);
  set(count, 10);
  expect(get(doubled)).toBe(20);
});

test("complex dependencies", () => {
  let name = signal("dan");
  let uppercased = computed(() => get(name).toUpperCase());
  let reversed = computed(() => Array.from(get(uppercased)).reverse().join(""));
  let length = computed(() => get(name).length);
  let together = computed(() => {
    return `${get(uppercased)} ${get(reversed)} ${get(length)}`;
  });
  expect(get(together)).toBe(`DAN NAD 3`);
});
