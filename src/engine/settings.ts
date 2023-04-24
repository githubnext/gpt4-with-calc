import { ApiKeyOption } from "./options";

// Our tokenization may not match pefectly, so assume a model is smaller than it is, except when actually performing final check before submission.
export const MODEL_SIZE_TOLERANCE = 10;

export const models: {
  [key: string]: { endpoint: string; apiKeyName: ApiKeyOption; maxTokens: number };
} = {
  "cushman-ml-test": {
    endpoint: `https://cushman-ml-test-centralus.openai.azure.com/openai/v1/engines/cushman-ml-test/completions`,
    apiKeyName: "aipApiKey", // AIP_API_KEY
    maxTokens: 4096 - MODEL_SIZE_TOLERANCE,
  },
  boosted: {
    endpoint:
      "https://model-2.openai.azure.com/openai/deployments/dv3/completions?api-version=2022-12-01",
    apiKeyName: "aoaiApiKey", // AOAI_API_KEY
    maxTokens: 32700 - MODEL_SIZE_TOLERANCE,
  },
  "text-davinci-001": {
    endpoint: "https://api.openai.com/v1/completions",
    apiKeyName: "openaiApiKey", // OPENAI_API_KEY
    maxTokens: 2048 - MODEL_SIZE_TOLERANCE - 150,
  },
  "text-davinci-002": {
    endpoint: "https://api.openai.com/v1/completions",
    apiKeyName: "openaiApiKey", // OPENAI_API_KEY
    maxTokens: 4096 - MODEL_SIZE_TOLERANCE,
  },
  "text-davinci-003": {
    endpoint:
      "https://copilot-playground.openai.azure.com/openai/deployments/text-davinci-003/completions?api-version=2022-06-01-preview",
    apiKeyName: "copilotPlaygroundApiKey", // COPILOT_PLAYGROUND_API_KEY
    maxTokens: 4096 - MODEL_SIZE_TOLERANCE,
  },
  "code-cushman-002": {
    endpoint: "https://api.openai.com/v1/completions",
    apiKeyName: "openaiApiKey", // OPENAI_API_KEY
    maxTokens: 4096 - MODEL_SIZE_TOLERANCE,
  },
  "code-davinci-002": {
    endpoint: "https://api.openai.com/v1/completions",
    apiKeyName: "openaiApiKey", // OPENAI_API_KEY
    maxTokens: 8001 - MODEL_SIZE_TOLERANCE,
  },
  "next-model2": {
    endpoint:
      "https://model-2.openai.azure.com/openai/deployments/dv3/completions?api-version=2022-12-01",
    apiKeyName: "nextModel2ApiKey", // NEXT_MODEL_2_API_KEY
    maxTokens: 32700 - MODEL_SIZE_TOLERANCE,
  },
  "next-model3": {
    endpoint:
      "https://model-3.openai.azure.com/openai/deployments/dv3/completions?api-version=2022-12-01",
    apiKeyName: "nextModel3ApiKey",
    maxTokens: 32700 - MODEL_SIZE_TOLERANCE,
  },
};

export function reqCacheFile(qualifiers: string) {
  return ".gpt4e/cache" + (qualifiers ? "-" + qualifiers : "");
}
