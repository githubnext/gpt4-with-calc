import * as fs from "fs";
import * as path from "path";
import * as settings from "./settings";
import { EngineContext } from "./context";

// Local request caches are for development purposes only, avoiding repeated requests to the AI models
// when developing locally or re-running baselines when only post-processing of results has changed.
// They are not used in production.

// This explicitly details the data we serialize to the local request cache files
export type LocalRequestCacheEntry =
  | {
      kind: "completion";
      status: number;
      statusText?: string;
      error?: string;
      choices: string[];
    }
  | {
      kind: "logprobs";
      status: number;
      tokens: {
        offsetInAnalysisText: number;
        token: string;
        logprob: number;
        toptoken: string | undefined;
      }[];
    }
  | {
      kind: "ghcache";
      res: any;
    };

export type LocalRequestCache = {
  entries: Record<string, LocalRequestCacheEntry>;
  changed: boolean;
};

export function writeLocalCache(ctxt: EngineContext) {
  if (ctxt.requestCache && ctxt.requestCacheFile && ctxt.requestCache.changed) {
    //if (ctxt.verbose) {
    console.log("    * writing request cache to", ctxt.requestCacheFile);
    //}
    fs.mkdirSync(path.dirname(ctxt.requestCacheFile), { recursive: true });
    fs.writeFileSync(ctxt.requestCacheFile, JSON.stringify(ctxt.requestCache, null), "utf8");
    ctxt.requestCache.changed = false;
  }
}
export function loadLocalCache(ctxt: EngineContext, prefix: string) {
  const model = ctxt.model;
  if (ctxt.useLocalCache) {
    const requestCacheFile = settings.reqCacheFile(prefix + "-model-" + model + "-v2");
    if (fs.existsSync(requestCacheFile)) {
      //if (ctxt.verbose) {
      console.log("    * reading request cache from", requestCacheFile);
      //}
      try {
        const requestCache = JSON.parse(fs.readFileSync(requestCacheFile, "utf8")) || {};
        ctxt.requestCache = requestCache;
        ctxt.requestCacheFile = requestCacheFile;
        return;
      } catch (e) {
        //if (ctxt.verbose) {
        console.log("    * failed reading request cache from", requestCacheFile, " - ignoring");
        //}
      }
    } else {
      ctxt.requestCache = { entries: {}, changed: false };
      ctxt.requestCacheFile = requestCacheFile;
    }
  }
}

let lastKey = "";

export function lookupLocalCache(
  ctxt: EngineContext,
  keyData: any
): LocalRequestCacheEntry | undefined {
  const cache = ctxt.requestCache;
  if (cache) {
    const key = JSON.stringify(keyData);
    lastKey = key;
    return cache.entries[key];
  }
  return undefined;
}

export function setLocalCache(
  ctxt: EngineContext,
  status: number,
  keyData: any,
  entry: LocalRequestCacheEntry
) {
  if (status == 200 || status == 400) {
    const cache = ctxt.requestCache;
    if (cache) {
      const key = JSON.stringify(keyData);
      // const hash = crypto.createHash("sha256");
      // hash.write(key);
      // console.log("cache set: " + hash.update(key).digest("hex") + "");
      if (ctxt.deterministic && lastKey != key) {
        console.log("cache match: no match");
        console.log("cache key1: " + lastKey);
        console.log("cache key2: " + key);
      }
      cache.entries[key] = entry;
      cache.changed = true;
    }
  } else {
    console.log("setLocalCache: not caching status", status);
  }
}
