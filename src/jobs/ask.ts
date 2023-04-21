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
  //* If the label is a solution to one or more equations, first document the algebraic derivation of the solution using labels, then use the solution in terms of labels as the definition.

  makePrimer() {
    return `# Guidance

Do not answer the question. Instead, write some arithmetic and comparisons relevant to answering the question.

After the question write a code block with up to three sections. 

In the "Definitions" section:
* Define a label for each number in the question like \`car_count\` or \`speed_of_car\`.
* This section should be valid Javascript definitions, end each with a semicolon.
* This section can include valid Javascript single-dimensional arrays.
* Do not use or create multi-dimensional arrays.
* Omit this section if there are no numbers in the question.

In the "Arithmetic" section:
* Define additional relevant labels using Javascript expressions.
* Define each label using an expression that references previously defined labels.
* Do NOT include the calculated values for labels in code or comments.
* Avoid new assumptions in this section. If you make an assumption document it.
* This section should be valid Javascript definitions, end each with a semicolon.
* Omit this section if there are no additional labels relevant to the answer.
* Use integer division when dividing things that are individually indivisible.

In the "Comparisons" section:
* Define additional relevant labels using Javascript expressions by comparing labels using comparison operators and functions and evaluating to single boolean values.
* Do NOT include the calculated true/false values for these labels.
* This section should be valid Javascript definitions, end each with a semicolon.
* Omit this section if there are no comparisons relevant to the answer.

In all sections:
* Every label name should include the unit if known.
* Document each label in a comment after each definition.
* Include a unit in the comment, like [billions_of_dollars], [metric_tons], [square meters], [apples] or [meetings/week].
* If the unit is unknown use [unknown].

Finish with a single unnamed Javascript record expression that puts all the defined values into a single object. 

# Question\n\n`;
  }

  makeInvitation(): string {
    return `\n\n
## Relevant arithmetic and comparisons

\`\`\`\`javascript`;
  }

  parseResponse(response: string): string {
    return response;
  }
}

export class AskQuestionStrategy {
  constructor(readonly question: string, readonly singleline: boolean) {}

  stops = this.singleline ? ["\n"] : ["\n# "];

  makePrimer() {
    return `# Question\n\n`;
  }

  makeInvitation(): string {
    return `\n\n# Answer${
      this.singleline
        ? "\n\nWrite a single one-line answer to the above question. Use the format\n\nANSWER: <answer>\n\nWrite your answer below.\n\nANSWER:"
        : ""
    }`;
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
  id: string,
  question: string,
  ct: ICancellationToken
): Promise<string> {
  if (ctxt.arith) {
    console.log(`[${id}]: Generating arithmetic code...`);
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
    console.log(`---------------- [${id}] arithmetic code ----------------`);
    console.log(arithmeticCode);

    console.log(`[${id}]: Evaluating arithmetic code...`);
    let arithmeticResults: any;
    try {
      arithmeticResults = eval(arithmeticCode);
    } catch (e) {
      arithmeticResults = "";
    }
    console.log(`---------------- [${id}] arithmetic results ----------------`);
    console.log(arithmeticResults);

    console.log(`[${id}]:Generating answer...`);
    const strategy2 = new AskQuestionStrategy(question, ctxt.singleline);
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
    const strategy = new AskQuestionStrategy(question, ctxt.singleline);
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
