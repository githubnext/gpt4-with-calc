import * as settings from "./settings";
import * as promptlib from "copilot-promptlib";
import * as context from "./context";

export type EngineContext = context.EngineContext;

// A "crash into the garage wall" prompt builder where we keep trying to add more work to the prompt
// until we crash into the overall size limit.
export class PromptBuilder {
  readonly modelSize: number;
  prompt = "";
  count = 0;
  minTokens = 0;
  maxTokens = 0;

  constructor(
    primer: string,
    readonly modelChoice: string,
    initialMinTokens: number,
    initialMaxTokens: number
  ) {
    this.minTokens = initialMinTokens;
    this.maxTokens = initialMaxTokens;
    this.prompt = primer;
    this.modelSize = settings.models[modelChoice].maxTokens;
  }

  promptSizeOk(prompt: string, invitation: string, minreq: number): boolean {
    const promptLength = promptlib.getTokenizer().tokenLength(prompt + "\n\n" + invitation);
    const tokenRequest = this.minTokens + minreq;
    return promptLength + tokenRequest < this.modelSize;
  }

  tryAddMorePrompt(
    chunk: string,
    extraMinTokens: number,
    extraMaxTokens: number,
    invitation: string
  ): boolean {
    const newPrompt = this.prompt + chunk;
    const sizeOk = this.promptSizeOk(newPrompt, invitation, extraMinTokens);

    if (sizeOk) {
      // OK, we have space to try to add more hunks
      this.count++;
      this.minTokens += extraMinTokens;
      this.maxTokens += extraMaxTokens;
      this.prompt = newPrompt;
      return true;
    } else {
      // OK, this hunk blew the prompt, reject it
      return false;
    }
  }

  finalizePrompt(invitation: string): string {
    return this.prompt + "\n\n" + invitation;
  }
}

type PromptForWork<T> = {
  prompt: string;
  included: T[];
  // The space left in the prompt for the response
  minTokens: number;
  maxTokens: number;
  skipped?: T;
  sizeOk: boolean;
};

// Assume we have a list of work items, and we want to build a prompt that includes
// as many of them as possible, but not more than the model size limit.
//
// This function will return a prompt that includes as many of the work items as possible,
// and a list of the work items that were included and the work items that were skipped.
//
// Skipped work items are work items that were too big to fit in the prompt.
export function createMultiplePrompts<T>(
  items: T[],
  primer: string,
  modelChoice: string,
  initialMinTokens: number,
  initialMaxTokens: number,
  extraMinTokensPerItem: number,
  extraMaxTokensPerItem: number,
  makeChunk: (item: T) => string,
  trySplitLargeItem: (item: T) => T[] | undefined,
  makeInvitation: (items: T[]) => string
): PromptForWork<T>[] {
  let index = 0;
  const prompts: PromptForWork<T>[] = [];
  const queue = items.slice();

  // Process all hunks in groups until none left
  while (queue.length > 0) {
    const start = index;
    let done_group = false;
    const builder = new PromptBuilder(primer, modelChoice, initialMinTokens, initialMaxTokens);

    // Collect a group of hunks into the builder
    while (queue.length > 0 && !done_group) {
      const item = queue.shift() as T;
      const promptChunk = makeChunk(item);
      const invitation = makeInvitation(items.slice(start, index + 1));
      const added = builder.tryAddMorePrompt(
        promptChunk,
        extraMinTokensPerItem,
        extraMaxTokensPerItem,
        invitation
      );

      if (added) {
        index++;
      }
      // If the hunk was added, or solitary, then proceed, otehrwise push it back
      if (added || builder.count === 0) {
        done_group = !added;
      } else {
        queue.unshift(item);
        done_group = true;
      }
    }
    // Did we build a group? If so push it.
    if (builder.count > 0) {
      const includedItems = items.slice(start, start + builder.count);
      const finalInvitation = makeInvitation(includedItems);
      const finalSizeOk = builder.promptSizeOk(builder.prompt, finalInvitation, builder.count);
      const finalPrompt = builder.prompt + "\n\n" + finalInvitation;

      prompts.push({
        prompt: finalPrompt,
        included: includedItems,
        minTokens: builder.minTokens,
        maxTokens: builder.maxTokens,
        sizeOk: finalSizeOk,
      });
    } else {
      // If we failed to build a group it was because a solitary chunk was too big.
      // Try to split it into smaller chunks.
      const item = items[start];
      const split = trySplitLargeItem(item);
      if (split) {
        // If the split succeeds, expand the items, push the new items and
        // continue around the loop
        items = [start ? items.slice(0, start) : [], split, items.slice(start + 1)].flat();
        queue.unshift(...split);
      } else {
        // If the split fails, then skip the item
        index++;
        prompts.push({
          prompt: "",
          included: [],
          minTokens: 0,
          maxTokens: 0,
          skipped: item,
          sizeOk: true,
        });
      }
    }
  }
  return prompts;
}
