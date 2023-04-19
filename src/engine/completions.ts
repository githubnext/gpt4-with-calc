import * as util from "util";
import * as settings from "./settings";
import { EngineContext } from "./context";
import { lookupLocalCache, setLocalCache } from "./local-cache";
import * as promptlib from "copilot-promptlib";
import { FetchOptions } from "./fetcher";
import { FilterCompletion, SSEToTokens, Token } from "./stream_transformer";
import * as stream_consumers from "stream/consumers";
import { Readable } from "stream";
import { ICancellationToken, MutableToken } from "../util/cancellation";
import { Result, resultOk } from "./result";
import { ModelChoiceOption } from "./options";
import { sleep } from "radash";

//--------------------------------------------------------
// Fetching from a Code Model

export declare interface CompletionRequest {
  prompt: string;
  model: string;
  max_tokens: number;
  n: number;
  echo: boolean;
  temperature?: number;
  top_p?: number;
  stop?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  logprobs?: number;
  stream: boolean;
}

/**
 * Performs semantically neutral transformations on the request
 * needed to make it conform by the API.
 * In particular, it replaces an empty string of stop sequences by undefined.
 *
 * Modifies the request in place.
 */
export function fortifyRequest(request: CompletionRequest): void {
  if (request.stop && request.stop.length === 0) {
    delete request.stop;
  }
}

export type RequestContext = {
  payload: {
    repository: {
      id: number;
      owner: {
        login: string;
      };
      name: string;
    };
    sender: {
      id: number;
    };
  };
};

type Headers = { [key: string]: string };

type EndpointInfo = {
  model: string;
  apikey: string;
  endpoint: string;
  headers: Headers;
};

export async function getOneUnstreamedCompletion(
  ctxt: EngineContext,
  prompt: string,
  stops: string[],
  minTokens: number,
  maxTokens: number,
  modelChoiceOption: ModelChoiceOption,
  ct: ICancellationToken
): Promise<Result<string>> {
  if (ctxt.verbose) {
    console.log(`-------------------------prompt ------------------------`);
    console.log(prompt);
    console.log("--------------------------------------------------------");
  }

  const completionsAttempt = await getMultipleUnstreamedCompletions(
    ctxt,
    1,
    prompt,
    stops,
    minTokens,
    maxTokens,
    modelChoiceOption,
    ct
  );
  if (!completionsAttempt.completed) {
    return completionsAttempt;
  }
  const completions = completionsAttempt.result;

  if (completions.choices.length < 1) {
    throw new Error(completions.statusText + ": " + completions.errors);
  }
  if (ctxt.verbose) {
    completions.choices.forEach((choice) => {
      console.log(`----------completion choice--------------`);
      console.log(choice);
      console.log(`-----------------------------------------`);
    });
  }
  return resultOk(completions.choices[0]);
}

export type MultipleCompletions = {
  choices: string[];
  status: number;
  statusText?: string;
  errors?: string;
};

export async function getMultipleUnstreamedCompletions(
  ctxt: EngineContext,
  numCompletionAttempts: number,
  prompt: string,
  stops: string[],
  minTokens: number,
  maxTokens: number,
  modelChoiceOption: ModelChoiceOption,
  ct: ICancellationToken
): Promise<Result<MultipleCompletions>> {
  const info = getEndpointInfo(ctxt, modelChoiceOption);

  const modelSize = settings.models[ctxt[modelChoiceOption]].maxTokens;
  const promptSize = promptlib.getTokenizer().tokenLength(prompt);
  const maxCompletionSize = modelSize - promptSize + settings.MODEL_SIZE_TOLERANCE;
  if (maxCompletionSize < minTokens) {
    throw new Error(
      `The input for a completion request was too large, the prompt had ${promptSize} tokens ` +
        `and a minimum completion length of ${minTokens} was requested, but the model only has ` +
        `maximum size ${modelSize} tokens`
    );
  }
  const requestedMaxTokens = Math.min(maxTokens, maxCompletionSize);

  // Report the count of the tokens in the prompt
  ctxt.workListener.onTokensAnalyzed(promptSize);

  const request: CompletionRequest = {
    prompt: prompt,
    max_tokens: requestedMaxTokens,
    temperature: ctxt.temperature,
    model: info.model,
    n: ctxt.temperature == 0 ? 1 : numCompletionAttempts,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: stops,
    echo: false,
    logprobs: undefined,
    stream: true,
  };

  if (ctxt.verbose) {
    console.log(
      `Waiting for parallelism to drop to ${ctxt.maxConcurrency}, currently ${ctxt.parallelism}`
    );
  }
  while (ctxt.parallelism > ctxt.maxConcurrency) {
    await sleep(100);
  }
  if (ctxt.verbose) {
    console.log(`We're in!`);
  }
  ctxt.parallelism++;

  let completions: MultipleCompletions;
  try {
    const completionsAttempt = await getUnstreamedCompletionsInternal(ctxt, info, request, ct);
    if (!completionsAttempt.completed) {
      return completionsAttempt;
    }
    completions = completionsAttempt.result;
  } finally {
    ctxt.parallelism--;
  }

  return resultOk(completions);
}

// THe inner part of getUnstreamedCompletions.
async function getUnstreamedCompletionsInternal(
  ctxt: EngineContext,
  info: EndpointInfo,
  body: CompletionRequest,
  ct: ICancellationToken
): Promise<Result<MultipleCompletions>> {
  ctxt.workListener.onCompletionRequest();
  const key = { endpoint: info.endpoint, json: body, headers: info.headers };
  const cached = lookupLocalCache(ctxt, key);

  // For items drawn from the local cache, replay the token counts as if they really happened, to give deterministic results
  if (cached && cached.kind == "completion") {
    for (const choice of cached.choices) {
      const tokenCount = promptlib.getTokenizer().tokenLength(choice);
      ctxt.workListener.onTokensGenerated(tokenCount);
    }
    return resultOk(cached);
  }

  const completionsAttempt = await getStreamedCompletions(ctxt, info, body, ct);
  if (!completionsAttempt.completed) {
    return completionsAttempt;
  }
  const completions = completionsAttempt.result;

  // 400 responses indicate legitimate failures and we store those in the cache
  const result: MultipleCompletions = {
    status: completions.status,
    statusText: completions.statusText,
    errors: completions.errors,
    choices: completions.status == 400 ? [] : await Promise.all(completions.choices.map(readText)),
  };

  setLocalCache(ctxt, completions.status, key, {
    kind: "completion",
    ...result,
  });
  return resultOk(result);
}

async function readText(stream: Readable): Promise<string> {
  let text = "";
  for await (const chunk of stream) {
    text += (chunk as Token).text;
  }
  return text;
}

type StreamedCompletions = {
  status: number;
  statusText?: string;
  // These are objectMode readables for which each chunk is a Token
  choices: Readable[];
  errors?: string;
};

async function getStreamedCompletions(
  ctxt: EngineContext,
  info: EndpointInfo,
  body: CompletionRequest,
  ct: ICancellationToken
): Promise<Result<StreamedCompletions>> {
  fortifyRequest(body);

  const options: FetchOptions = {
    headers: info.headers,
    body,
    ...ctxt,
  };

  const mutableToken = new MutableToken();
  ct.onCancellationRequested(() => mutableToken.cancel());

  const fetchAttempt = await ctxt.services.fetcher.fetch(info.endpoint, options, mutableToken);
  if (!fetchAttempt.completed) {
    return fetchAttempt;
  }
  const response = fetchAttempt.result;

  // Different completions stream back independently, mixed up. So we de-multiplex
  // the responses here.
  const choices: Readable[] = [];
  let errors = undefined;
  if (response.status === 200) {
    const sseStream = response.body.pipe(new SSEToTokens(ctxt.workListener));
    for (let i = 0; i < body.n; i++) {
      const stream = sseStream.pipe(new FilterCompletion(i));
      choices.push(stream);
    }
  } else {
    try {
      errors = await stream_consumers.text(response.body);
    } catch (e) {
      errors = "Failed to read error response";
    }
  }

  return resultOk({
    status: response.status,
    statusText: response.statusText,
    choices,
    errors,
  });
}

// Apply any overrides and work out the headers
function getEndpointInfo(ctxt: EngineContext, modelChoiceOption: ModelChoiceOption): EndpointInfo {
  const model = ctxt[modelChoiceOption];
  const { endpoint, apiKeyName } = settings.models[model];
  const apikey = ctxt[apiKeyName];
  if (!apikey) {
    throw new Error(`No API key ${apiKeyName} found for model ${model}`);
  }
  let headers: { [key: string]: string } = {};
  if (endpoint.startsWith("https://cushman-ml-test-centralus")) {
    headers = {
      Authorization: util.format("Bearer %s", apikey),
      "Openai-Organization": "github-copilot",
      "OpenAI-Intent": "copilot-sidebar",
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": apikey,
    };
  } else if (
    endpoint.startsWith("https://models.openai.azure.com/") ||
    endpoint.startsWith("https://model-2.openai.azure.com/") ||
    endpoint.startsWith("https://model-3.openai.azure.com/")
  ) {
    headers = {
      "api-key": apikey,
      "Content-Type": "application/json",
      "x-policy-id": ctxt.raiPolicyId,
    };
  } else if (endpoint.startsWith("https://copilot-playground.openai.azure.com/")) {
    headers = {
      "api-key": apikey,
      "Content-Type": "application/json",
    };
  } else {
    headers = {
      Authorization: util.format("Bearer %s", apikey),
      "Content-Type": "application/json",
    };
  }
  return { headers, endpoint, apikey, model };
}
