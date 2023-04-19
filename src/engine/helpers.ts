import async from "async";
import { EngineContext } from "./context";

// map in parallel, up to a limit.  If `deterministic` is true then don't run more than one at a time to make deterministic
// in the outputs to console.
export async function mapLimitControlled<T, U>(
  options: EngineContext,
  inputs: T[],
  limit: number,
  fn: (input: T, index: number) => Promise<U>
): Promise<U[]> {
  const indexedInputs = inputs.map((input, index) => ({ value: input, index }));
  if (options.deterministic) {
    return async.mapSeries(
      indexedInputs,
      async.asyncify(async (input: { value: T; index: number }) => fn(input.value, input.index))
    );
  } else {
    return async.mapLimit(
      indexedInputs,
      limit,
      async.asyncify(async (input: { value: T; index: number }) => fn(input.value, input.index))
    );
  }
}
