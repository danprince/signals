# Signals

Tiny signals library built for learning and experimenting.

```ts
let name = signal("dan");

get(name); // "dan"
set(name, "signal");
get(name); // "signal"
```

Computed signals change automatically.

```ts
let name = signal("dan");
let uppercased = computed(() => get(name).toUpperCase());

get(uppercased); // "DAN"
set(name, "signal");
get(uppercased); // "SIGNAL"
```

Effects re-run when their dependencies change.

```ts
let name = signal("dan");
let uppercased = computed(() => get(name).toUpperCase());

effect(() => console.log(get(uppercased)));
// logs "DAN"
set(name, "signal");
// logs "SIGNAL"
```

Transactions rollback updates after errors.

```ts
let name = signal("dan");

transact(() => {
  set(name, "signals");
  get(name); // "signals"
  throw new Error("uh oh");
});

get(name); // "dan"
```

Transactions can also rollback manually.

```ts
let name = signal("dan");

transact(rollback => {
  set(name, "signals");
  get(name); // "signals"
  return rollback();
});

get(name); // "dan"
```

Transactions defer effects until after they have run successfully.
