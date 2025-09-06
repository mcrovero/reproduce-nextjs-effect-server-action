"use server";

import { Effect } from "effect";

async function getData(input: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { data: "done " + input };
}

// Simple execution not viable as a Server Action
export const doSomethingNoWrapper = (input: number) =>
  Effect.promise(() => getData(input)).pipe(Effect.runPromise);

// Workaround: async function
export const doSomethingNoWrapperAync = async (input: number) =>
  Effect.promise(() => getData(input)).pipe(Effect.runPromise);

// Using wrapper function

function runEffectAction<I, O, E>(
  effectFn: (args: I) => Effect.Effect<O, E, never>
) {
  return async (args: I): Promise<O> => {
    return await Effect.runPromise(effectFn(args));
  };
}

export const doSomethingEffect = runEffectAction((input: number) =>
  Effect.promise(() => getData(input))
);

/**
 * The type of doSomethingEffect is:
 * const doSomethingEffect: (args: number) => Promise<{
 *   data: string;
 * }>
 */

export const doSomethingEffectFn = runEffectAction(
  Effect.fn(function* (input: number) {
    return yield* Effect.promise(() => getData(input));
  })
);

export const doSomethingEffectFnNoGenerator = runEffectAction(
  Effect.fn((input: number) => Effect.promise(() => getData(input)))
);
