import { WorkListener } from "./work_listener";
import { LocalRequestCache } from "./local-cache";
import { Services } from "./services";
import { CommonEngineOptions } from "./options";

export type EngineContext = {
  // Note: these get initialised by initRequestCache
  requestCacheFile: string | null;
  requestCache: LocalRequestCache | null;
  readonly services: Services;
  readonly workListener: WorkListener;
  parallelism: number;
} & CommonEngineOptions;

export async function buildEngineContext(
  services: Services,
  commonEngineOptions: CommonEngineOptions
): Promise<EngineContext> {
  return {
    services,
    requestCache: null,
    requestCacheFile: null,
    workListener: new WorkListener(),
    parallelism: 0,
    ...commonEngineOptions,
  };
}
