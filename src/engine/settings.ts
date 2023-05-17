import { ApiKeyOption } from "./options";

// Our tokenization may not match pefectly, so assume a model is smaller than it is, except when actually performing final check before submission.
export const MODEL_SIZE_TOLERANCE = 10;

export const models: {
  [key: string]: { endpoint: string; apiKeyName: ApiKeyOption; maxTokens: number };
} = {
  "text-davinci-003": {
    endpoint: "https://api.openai.com/v1/completions",
    apiKeyName: "openaiApiKey", // OPENAI_API_KEY
    maxTokens: 8092 - MODEL_SIZE_TOLERANCE,
  },
};

export function reqCacheFile(qualifiers: string) {
  return ".gpte/cache" + (qualifiers ? "-" + qualifiers : "");
}
