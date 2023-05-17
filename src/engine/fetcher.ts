import colors from "colors/safe";
import * as helixFetch from "@adobe/fetch";
import { AbortError, RequestOptions } from "@adobe/fetch";
import { Readable } from "stream";
import * as debugModule from "debug";
import { Result, isResultOk, resultOk } from "./result";
import { ModelRetryOption } from "./options";
import * as stream_consumers from "stream/consumers";

const debug = debugModule.debug("prbot:fetcher");

export type FetchOptions = {
  headers: { [name: string]: string };
  body: any;
} & ModelRetryOption;

export type FetchResponse = {
  status: number;
  statusText: string;
  body: string;
};

export class Fetcher {
  constructor(readonly fetchApi: ReturnType<typeof helixFetch.context>) {}

  static async create() {
    const fetchApi = helixFetch.context({
      rejectUnauthorized: false,
      alpnProtocols: ["h2" as helixFetch.ALPNProtocol],
    });
    return new Fetcher(fetchApi);
  }

  async close() {
    await this.fetchApi.reset();
  }

  async fetch(url: string, options: FetchOptions): Promise<Result<FetchResponse>> {
    let delayMs = options.retryInitialDelay;
    for (let i = 0; i < options.retryCount; i++) {
      try {
        const result = await this.fetchOrThrow(url, options);
        if (isResultOk(result)) {
          if (result.result.status != 429 && result.result.status != 500) {
            return result;
          }
          const message = `${result.result.status} ${result.result.body}`;
          console.error(
            colors.yellow(`Retryable error (${i} of ${options.retryCount}): ${message}`)
          );
        } else {
          const message = `${result.reason} : ${result.message}`;
          debug("Non Retryable error (%d of %d): %s", i, options.retryCount, message);
          return result;
        }
      } catch (reason: any) {
        if (
          reason.code == "ECONNRESET" ||
          reason.code == "ETIMEDOUT" ||
          reason.code == "ERR_HTTP2_INVALID_SESSION" ||
          reason.message == "ERR_HTTP2_GOAWAY_SESSION" ||
          reason.code == "429"
        ) {
          debug(
            "Retryable error (%d of %d): %s",
            i,
            options.retryCount,
            reason.code || reason.message
          );
        } else {
          debug(
            "Non Retryable error (%d of %d): %s",
            i,
            options.retryCount,
            reason.code || reason.message
          );
          throw reason;
        }
      }
      const jitter = Math.floor(Math.random() * delayMs * 0.1);
      const delay = delayMs + jitter;
      console.error(colors.yellow(`Waiting ${delay}ms`));
      await new Promise((resolve) => setTimeout(resolve, delay));
      delayMs *= options.retryBackoffFactor;
    }
    return resultOk({
      status: 0,
      statusText: `Gave up after ${options.retryCount} retries`,
      headers: {},
      body: "",
    });
  }

  private async fetchOrThrow(url: string, options: FetchOptions): Promise<Result<FetchResponse>> {
    const abortController = new helixFetch.AbortController();
    const helixOptions: RequestOptions = {
      body: options.body,
      headers: headersKeyValueToHelix(options.headers),
      signal: abortController.signal,
      cache: "no-cache",
      method: "POST",
    };
    const resp = await this.fetchApi.fetch(url, helixOptions);

    const body = resp.body ? new Readable().wrap(resp.body) : new Readable();
    body.on("error", (err) => {
      if (err instanceof AbortError || err.name == "AbortError") {
        debug("Stream aborted: ignoring error");
      } else if (
        err.message == "ERR_HTTP2_STREAM_ERROR" ||
        (err as any).code == "ERR_HTTP2_STREAM_ERROR"
      ) {
        debug("Stream closed: ignoring error");
      } else {
        debug("Unexpected error", err);
        throw err;
      }
    });
    return resultOk({
      status: resp.status,
      statusText: resp.statusText,
      body: await stream_consumers.text(body),
    });
  }
}

function headersKeyValueToHelix(headers: { [name: string]: string }): helixFetch.Headers {
  const result = new helixFetch.Headers();
  for (const name in headers) {
    result.set(name, headers[name]);
  }
  return result;
}
