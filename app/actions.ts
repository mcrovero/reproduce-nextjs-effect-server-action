"use server";

import { Effect } from "effect";

async function getData(input: number) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { data: "done " + input };
}

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

export const doSomethingEffectFn = runEffectAction(
  Effect.fn(function* (input: number) {
    return yield* Effect.promise(() => getData(input));
  })
);

export const doSomethingEffectFnNoGenerator = runEffectAction(
  Effect.fn((input: number) => Effect.promise(() => getData(input)))
);

/**
 * The type of doSomethingEffect is:
 * const doSomethingEffect: (args: number) => Promise<{
 *   data: string;
 * }>
 */
