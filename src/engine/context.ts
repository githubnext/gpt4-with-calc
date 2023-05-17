import { WorkListener } from "./work_listener";
import { LocalRequestCache } from "./local-cache";
import { Fetcher } from "./fetcher";
import { CommonEngineOptions } from "./options";

export type EngineContext = {
  // Note: these get initialised by initRequestCache
  requestCacheFile: string | null;
  requestCache: LocalRequestCache | null;
  readonly fetcher: Fetcher;
  readonly workListener: WorkListener;
  parallelism: number;
} & CommonEngineOptions;

export async function buildEngineContext(
  fetcher: Fetcher,
  commonEngineOptions: CommonEngineOptions
): Promise<EngineContext> {
  return {
    fetcher,
    requestCache: null,
    requestCacheFile: null,
    workListener: new WorkListener(),
    parallelism: 0,
    ...commonEngineOptions,
  };
}
