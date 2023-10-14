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
