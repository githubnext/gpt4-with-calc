import colors from "colors/safe";
import * as helixFetch from "@adobe/fetch";
import { AbortError, RequestOptions } from "@adobe/fetch";
import { Readable, Transform } from "stream";
import * as debugModule from "debug";
import { ICancellationToken } from "../util/cancellation";
import { Result, cancelled, isResultOk, resultOk } from "./result";
//import { DataStore } from "./datastore";
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
  headers: { [name: string]: string };
  body: Readable;
};

class EndableStream extends Transform {
  private running = true;

  constructor(readonly abortController: helixFetch.AbortController) {
    super();
  }

  _transform(chunk: any, _encoding: string, callback: (err?: Error, data?: any) => void) {
    if (this.running) {
      this.push(chunk);
    }
    callback();
  }

  abort() {
    this.running = false;
    this.push(null);
    this.abortController.abort();
  }
}

export class Fetcher {
  constructor(
    readonly fetchApi: ReturnType<typeof helixFetch.context> //readonly dataStore: DataStore
  ) {}

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

  async fetch(
    url: string,
    options: FetchOptions,
    ct: ICancellationToken
  ): Promise<Result<FetchResponse>> {
    let delayMs = options.retryInitialDelay;
    for (let i = 0; i < options.retryCount; i++) {
      try {
        //await this.dataStore.recordModelRequest(i, "request", "");
        const result = await this.fetchOrThrow(url, options, ct);
        if (isResultOk(result)) {
          if (result.result.status != 429 && result.result.status != 500) {
            //await this.dataStore.recordModelRequest(i, "success", "");
            return result;
          }
          const message = `${result.result.status} ${await stream_consumers.text(
            result.result.body
          )}`;
          //await this.dataStore.recordModelRequest(i, "retryable-failure", message);
          console.error(
            colors.yellow(`Retryable error (${i} of ${options.retryCount}): ${message}`)
          );
        } else {
          const message = `${result.reason} : ${result.message}`;
          //await this.dataStore.recordModelRequest(i, "failure", message);
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
          // await this.dataStore.recordModelRequest(
          //   i,
          //   "retryable-failure",
          //   reason.code || reason.message
          // );
          debug(
            "Retryable error (%d of %d): %s",
            i,
            options.retryCount,
            reason.code || reason.message
          );
        } else {
          //await this.dataStore.recordModelRequest(i, "failure", reason.code || reason.message);
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
    //await this.dataStore.recordModelRequest(options.retryCount, "gave-up", "");
    return resultOk({
      status: 0,
      statusText: `Gave up after ${options.retryCount} retries`,
      headers: {},
      body: new Readable(),
    });
  }

  private async fetchOrThrow(
    url: string,
    options: FetchOptions,
    ct: ICancellationToken
  ): Promise<Result<FetchResponse>> {
    if (ct.isCancellationRequested) {
      return cancelled();
    }

    const abortController = new helixFetch.AbortController();
    const endableTransformer: EndableStream = new EndableStream(abortController);
    const deregister = ct.onCancellationRequested(() => endableTransformer.abort());
    try {
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
      body.on("close", deregister);
      return resultOk({
        status: resp.status,
        statusText: resp.statusText,
        headers: headersHelixToKv(resp.headers),
        body: body.pipe(endableTransformer),
      });
    } catch (e) {
      deregister();
      throw e;
    }
  }
}

function headersHelixToKv(headers: helixFetch.Headers): { [name: string]: string } {
  const result: { [name: string]: string } = {};
  for (const [name, value] of headers) {
    result[name] = value;
  }
  return result;
}

function headersKeyValueToHelix(headers: { [name: string]: string }): helixFetch.Headers {
  const result = new helixFetch.Headers();
  for (const name in headers) {
    result.set(name, headers[name]);
  }
  return result;
}
