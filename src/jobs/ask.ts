import { ICancellationToken } from "../util/cancellation";
import * as context from "../engine/context";
import { Services } from "../engine/services";
import { Options } from "../engine/options";
import * as completions from "../engine/completions";

export type EngineContext = context.EngineContext & Options["ask"];
export async function buildEngineContext(
  options: Options,
  services: Services
): Promise<EngineContext> {
  return {
    ...(await context.buildEngineContext(services, options.ask)),
    ...options.ask,
  };
}

export class WriteArithmeticStrategy {
  constructor(readonly question: string) {}

  stops = ["````"];

  makePrimer() {
    return `# Question\n\n`;
  }

  makeInvitation(): string {
    return `\n\n# Guidance

Do not answer the question. Your task is to write some arithmetic and comparisons relevant to answering the question.

After the question write a code block with up to three sections containing content relevant to answering the question.

In the "Definitions" section define a label for each number in the question like \`car_count\` or \`speed_of_car_in_km_per_hour\`.
* Every label name should includethe unit of measure if known.
* This section can include valid Javascript single-dimensional arrays.
* Do not use or create multi-dimensional arrays.
* Give each label a unit of measure in a comment after each definition.
* Document the meaning of each definition in the comment.
* If the unit of measure is unknown use "unknown".
* This section should be valid Javascript definitions, end each with a semicolon.
* Omit this section if there are no numbers in the question.

In the "Arithmetic" section define additional relevant labels using Javascript expressions.
* Define each label using an expression that references previously defined labels.
* Avoid new assumptions in this section, if you make an assumption document it.
* Every label name should include the unit of measure if known.
* Do NOT include the calculated values for these labels.
* Give each label a unit of measure in a comment after each definition.
* Document the meaning of each definition in the comment.
* If the unit of measure is unknown use "unknown".
* This section should be valid Javascript definitions, end each with a semicolon.
* Omit this section if there are no additional labels relevant to the answer.

In the "Comparisons" section define additional relevant labels using Javascript expressions by comparing labels using comparison operators and functions and evaluating to single boolean values.
* Do NOT include the calculated true/false values for these labels.
* This section should be valid Javascript definitions, end each with a semicolon.
* Document the meaning of each definition in the comment.
* Omit this section if there are no comparisons relevant to the answer.

Finish with a single unnamed Javascript record expression that puts all the defined values into a single object. 

## Relevant arithmetic and comparisons

\`\`\`\`javascript`;
  }

  parseResponse(response: string): string {
    return response;
  }
}

export class AskQuestionStrategy {
  constructor(readonly question: string) {}

  stops = ["\n# "];

  makePrimer() {
    return `# Question\n\n`;
  }

  makeInvitation(): string {
    return `\n\nWrite a single answer to the above question.\n\n# Answer\n\n`;
  }

  parseResponse(response: string): string {
    return response;
  }
}

const minArithmeticTokens = 1;
const maxArithmeticTokens = 4000;

const minAnswerTokens = 1;
const maxAnswerTokens = 4000;

export async function ask(
  ctxt: EngineContext,
  question: string,
  ct: ICancellationToken
): Promise<string> {
  if (ctxt.arith) {
    console.log("Generating arithmetic code...");
    const strategy = new WriteArithmeticStrategy(question);
    const completionAttempt = await completions.getOneUnstreamedCompletion(
      ctxt,
      strategy.makePrimer() + strategy.question + strategy.makeInvitation(),
      strategy.stops,
      minArithmeticTokens,
      maxArithmeticTokens,
      "model",
      ct
    );
    if (!completionAttempt.completed) {
      return "incomplete";
    }
    const arithmeticCode = completionAttempt.result;
    console.log(arithmeticCode);

    console.log("Evaluating arithmetic code...");
    const arithmeticResults = eval(arithmeticCode);
    console.log(arithmeticResults);

    console.log("Generating answer...");
    const strategy2 = new AskQuestionStrategy(question);
    const completionAttempt2 = await completions.getOneUnstreamedCompletion(
      ctxt,
      strategy2.makePrimer() +
        strategy2.question +
        "\n\n" +
        arithmeticCode +
        "\n\n" +
        JSON.stringify(arithmeticResults, null, 2) +
        strategy2.makeInvitation(),
      strategy2.stops,
      minAnswerTokens,
      maxAnswerTokens,
      "model",
      ct
    );
    if (!completionAttempt2.completed) {
      return "incomplete";
    }
    return completionAttempt2.result;
  } else {
    const strategy = new AskQuestionStrategy(question);
    const completionAttempt = await completions.getOneUnstreamedCompletion(
      ctxt,
      strategy.makePrimer() + strategy.question + strategy.makeInvitation(),
      strategy.stops,
      1,
      1000,
      "model",
      ct
    );
    if (!completionAttempt.completed) {
      return "incomplete";
    }
    return completionAttempt.result;
  }
}
