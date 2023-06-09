import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
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
      kind: "ghcache";
      res: any;
    };

export type LocalRequestCache = {
  entries: Record<string, LocalRequestCacheEntry>;
  changed: boolean;
};

export function writeLocalCache(ctxt: EngineContext) {
  if (ctxt.requestCache && ctxt.requestCacheFile && ctxt.requestCache.changed) {
    console.log("    * writing request cache to", ctxt.requestCacheFile);
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
      console.log("    * reading request cache from", requestCacheFile);
      try {
        const requestCache = JSON.parse(fs.readFileSync(requestCacheFile, "utf8")) || {};
        ctxt.requestCache = requestCache;
        ctxt.requestCacheFile = requestCacheFile;
        return;
      } catch (e) {
        console.log("    * failed reading request cache from", requestCacheFile, " - ignoring");
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
    const result = cache.entries[key];
    if (!result) {
      const hash = crypto.createHash("sha256");
      hash.write(key);
      console.error("cache miss: " + hash.update(key).digest("hex") + "");
    }
    return result;
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
      const hash = crypto.createHash("sha256");
      hash.write(key);
      console.error("cache set: " + hash.update(key).digest("hex") + "");
      if (ctxt.deterministic && lastKey != key) {
        console.error("cache match: no match");
        console.error("   cache key1: " + lastKey);
        console.error("   cache key2: " + key);
      }
      cache.entries[key] = entry;
      cache.changed = true;
    }
  } else {
    console.log("setLocalCache: not caching status", status);
  }
}
