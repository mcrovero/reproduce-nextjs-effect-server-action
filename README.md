## Next.js + Effect Server Actions: Compiler Limitation Reproduction

**Goal**: Demonstrate that the Next.js compiler currently rejects Promise-returning Server Actions unless they are declared as `async` functions directly. With the rising usage of `effect` that does not have async functions in the chain of function calls, it would be beneficial to allow Promise-returning Server Actions even when produced via higher-order functions. 

- **Repo**: `nextjs-effect-server-action-repro`
- **Next.js**: 15.5.2 (Turbopack)
- **React**: 19.1.0
- **effect**: ^3.17.13

### What this shows

The file `app/actions.ts` contains multiple variants of Server Actions integrated with `effect`:

- **`doSomethingNoWrapper`**: direct `Effect.runPromise(...)` call, but the export is not an `async` function → rejected.
- **`doSomethingNoWrapperAync`**: same logic, but exported as an `async` function → accepted.
- **`runEffectAction`**: a reusable wrapper that converts an `Effect` program into an `async` function returning a `Promise`.
- **`doSomethingEffect`**: uses `runEffectAction` with a plain `Effect.promise(...)` program → rejected by the compiler despite the wrapper producing an async function.
- **`doSomethingEffectFn` / `doSomethingEffectFnNoGenerator`**: use `Effect.fn(...)` for ergonomics, then wrap with `runEffectAction` → rejected by the compiler.

Key code (from `app/actions.ts`):

```11:12:app/actions.ts
export const doSomethingNoWrapper = (input: number) =>
  Effect.promise(() => getData(input)).pipe(Effect.runPromise);
```

```15:16:app/actions.ts
export const doSomethingNoWrapperAync = async (input: number) =>
  Effect.promise(() => getData(input)).pipe(Effect.runPromise);
```

```20:26:app/actions.ts
function runEffectAction<I, O, E>(
  effectFn: (args: I) => Effect.Effect<O, E, never>
) {
  return async (args: I): Promise<O> => {
    return await Effect.runPromise(effectFn(args));
  };
}
```

```28:30:app/actions.ts
export const doSomethingEffect = runEffectAction((input: number) =>
  Effect.promise(() => getData(input))
);
```

```39:47:app/actions.ts
export const doSomethingEffectFn = runEffectAction(
  Effect.fn(function* (input: number) {
    return yield* Effect.promise(() => getData(input));
  })
);

export const doSomethingEffectFnNoGenerator = runEffectAction(
  Effect.fn((input: number) => Effect.promise(() => getData(input)))
);
```

### Actual compiler behavior

Exact output from dev/build:

```text
○ Compiling / ...
 ✓ Compiled / in 2.3s
 ⨯ ./app/actions.ts:11:14
Ecmascript file had an error
   9 |
  10 | // Simple execution not viable as a Server Action
> 11 | export const doSomethingNoWrapper = (input: number) =>
     |              ^^^^^^^^^^^^^^^^^^^^
  12 |   Effect.promise(() => getData(input)).pipe(Effect.runPromise);
  13 |
  14 | // Workaround: async function

Server Actions must be async functions.




./app/actions.ts:28:50
Ecmascript file had an error
  26 | }
  27 |
> 28 | export const doSomethingEffect = runEffectAction((input: number) =>
     |                                                  ^^^^^^^^^^^^^^^^^^
> 29 |   Effect.promise(() => getData(input))
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  30 | );
  31 |
  32 | /**

Server Actions must be async functions.




./app/actions.ts:40:13
Ecmascript file had an error
  38 |
  39 | export const doSomethingEffectFn = runEffectAction(
> 40 |   Effect.fn(function* (input: number) {
     |             ^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 41 |     return yield* Effect.promise(() => getData(input));
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 42 |   })
     | ^^^^
  43 | );
  44 |
  45 | export const doSomethingEffectFnNoGenerator = runEffectAction(

Server Actions must be async functions.




./app/actions.ts:46:13
Ecmascript file had an error
  44 |
  45 | export const doSomethingEffectFnNoGenerator = runEffectAction(
> 46 |   Effect.fn((input: number) => Effect.promise(() => getData(input)))
     |             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  47 | );
  48 |

Server Actions must be async functions.



 ○ Compiling /_error ...
 ✓ Compiled /_error in 735ms
 GET / 500 in 3175ms
```

### Expected behavior

- As long as the exported binding is an `async` function returning a `Promise`, it should be accepted as a Server Action, regardless of whether it is produced by a higher-order function or uses `Effect.fn` internally.

### Workarounds

- Prefer a plain `async` function export. Avoid higher-order wrappers and `Effect.fn(...)` in the exported binding for now.
- Example (works today):

```15:16:app/actions.ts
export const doSomethingNoWrapperAync = async (input: number) =>
  Effect.promise(() => getData(input)).pipe(Effect.runPromise);
```

### How to reproduce

1. Install dependencies: `pnpm install`
2. Start dev server: `pnpm dev`
3. Observe the compiler behavior described above.
