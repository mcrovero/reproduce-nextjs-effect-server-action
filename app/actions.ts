"use server";

async function getData(input: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { data: "done " + input };
}

// This is not a valid Server Action
export const doSomethingPromise = (input: number) => getData(input);

// This is valid
export const doSomethingPromiseAsync = async (input: number) =>
  await getData(input);

/**
 * !! The EffectTs case to allow Promise-returning Server Actions !!
 **/
import { Effect } from "effect";

// Simple execution not viable as a Server Action
export const doSomethingNoWrapper = (input: number) =>
  Effect.promise(() => getData(input)).pipe(Effect.runPromise);

// Workaround: async function
export const doSomethingNoWrapperAync = async (input: number) =>
  Effect.promise(() => getData(input)).pipe(Effect.runPromise);

// Most of the time we run effects using a wrapper function
// There is no developer friendly way to run the wrapper with the async workaround

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
