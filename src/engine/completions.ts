import * as util from "util";
import * as settings from "./settings";
import { EngineContext } from "./context";
import { lookupLocalCache, setLocalCache } from "./local-cache";
import { FetchOptions } from "./fetcher";
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
  maxTokens: number,
  modelChoiceOption: ModelChoiceOption
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
    maxTokens,
    modelChoiceOption
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
  maxTokens: number,
  modelChoiceOption: ModelChoiceOption
): Promise<Result<MultipleCompletions>> {
  const info = getEndpointInfo(ctxt, modelChoiceOption);

  const requestedMaxTokens = maxTokens;

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
    stream: false,
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
    const completionsAttempt = await getUnstreamedCompletionsInternal(ctxt, info, request);
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
  body: CompletionRequest
): Promise<Result<MultipleCompletions>> {
  ctxt.workListener.onCompletionRequest();
  const key = { endpoint: info.endpoint, json: body, headers: info.headers };
  const cached = lookupLocalCache(ctxt, key);

  // For items drawn from the local cache, replay the token counts as if they really happened, to give deterministic results
  if (cached && cached.kind == "completion") {
    return resultOk(cached);
  }

  const options: FetchOptions = {
    headers: info.headers,
    body,
    ...ctxt,
  };

  const fetchAttempt = await ctxt.fetcher.fetch(info.endpoint, options);
  if (!fetchAttempt.completed) {
    return fetchAttempt;
  }
  const response = fetchAttempt.result;

  let choices: string[] = [];
  let errors = undefined;
  if (response.status === 200) {
    choices = JSON.parse(response.body).choices.map((choice: any) => choice.text);
  } else {
    errors = response.body;
  }

  // 400 responses indicate legitimate failures and we store those in the cache
  const result: MultipleCompletions = {
    status: response.status,
    statusText: response.statusText,
    errors,
    choices,
  };

  setLocalCache(ctxt, response.status, key, {
    kind: "completion",
    ...result,
  });
  return resultOk(result);
}

// Apply any overrides and work out the headers
function getEndpointInfo(ctxt: EngineContext, modelChoiceOption: ModelChoiceOption): EndpointInfo {
  const model = ctxt[modelChoiceOption];
  const { endpoint, apiKeyName } = settings.models[model];
  const apikey = ctxt[apiKeyName];
  if (!apikey) {
    throw new Error(`No API key ${apiKeyName} found for model ${model}`);
  }
  const headers = {
    Authorization: util.format("Bearer %s", apikey),
    "Content-Type": "application/json",
  };
  return { headers, endpoint, apikey, model };
}
