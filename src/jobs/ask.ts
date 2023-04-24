import { ICancellationToken } from "../util/cancellation";
import colors from "colors/safe";
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
  constructor(readonly question: string, readonly options: EngineContext) {}

  stops = ["```"];
  //* If the label is a solution to one or more equations, first document the algebraic derivation of the solution using labels, then use the solution in terms of labels as the definition.

  makePrimer() {
    return `# Guidance

Do not answer the question. Instead, write some calculations and comparisons relevant to answering the question. Do this by writing a code block with sections:
* Definitions
* Calculations${this.options.emitChecks ? "* Check\n" : ""}${
      !this.options.noEmitComparisons ? "* Comparisons\n" : ""
    }
* Return

General guidance for all sections about labels:
* Use names like \`car_count\` or \`speed_of_car_in_km_per_h\` for each label.
${
  !this.options.noEmitDescriptions
    ? "* Document each label with a descriptive comment at end of line.\n"
    : ""
}

${
  !this.options.noEmitUnits
    ? `General guidance for all sections about units:
* Every label name should include the unit if known.
* End each definition with a semicolon.
* Include a unit at the end of the comment, like [billions_of_dollars], [metric_tons], [square meters], [apples] or [meetings/week].
* If the unit is unknown use [unknown].

`
    : ""
}General guidance for all sections about code:
${
  !this.options.noSuppressArbitraryCode
    ? "* Do NOT use lambda expressions, loops, 'if/else', 'return', '=>' or function definitions.\n"
    : ""
}${
      !this.options.noEliminateDateTime
        ? "* Avoid all date/time calculations. Reduce to whole days, hours, minutes and arbitrary seconds."
        : ""
    }
In the optional "Definitions" section:
* Define a label for each number in the question.
* Define labels using Javascript 'const'.
* This section can include valid Javascript single-dimensional arrays.
* Do not use or create multi-dimensional arrays.
* Omit this section completely if it contains no definitions.

In the optional "Calculations" section:
* Define additional relevant labels using Javascript 'const'.
* Define each label using an expression that references previously defined labels.
* Do NOT include the calculated values for labels in code or comments.
* Do NOT solve equations, simply write relevant calculations.
* Avoid new assumptions in this section. If you make an assumption document it.
* This section should be valid Javascript definitions.
* Omit this section completely if it contains no definitions.
* Use integer division when appropriate.
* Calculate rounding in code where appropriate.
* Use values for constants such as pi and e from the Javascript Math library. 

${
  this.options.emitChecks
    ? `In the optional "Check" section:
* If appropriate, define the label \`check_message\` checking if results lie within the known range for the type of number.
* Omit this section completely if it contains no definitions.
* If failing the \`check_message\` value should evaluate to a string containing a description of why the check failed.
* If succeeding the \`check_message\` value should evaluate to an empty string
* Do NOT include the calculated string for this label.

`
    : ""
}${
      !this.options.noEmitComparisons
        ? `In the optional "Comparisons" section:
* Define additional labels relevant to the question using Javascript 'const' by comparing labels using comparison operators and functions and evaluating to single boolean values.
* Do NOT include the calculated true/false values for these labels.
* This section should be valid Javascript definitions.
* Omit this section completely if it contains no definitions.

`
        : ""
    }In the "Return" section (always present):
* A single "return" statement that puts all the defined values from the Calculations and Comparisons sections into a single object
* Then "//Done" and a new line 


# Question\n\n`;
  }

  makeInvitation(): string {
    return `\n\n
## Relevant calculations and comparisons

\`\`\`javascript`;
  }

  parseResponse(response: string): string {
    return response;
  }
}

export class AskQuestionStrategy {
  constructor(readonly question: string, readonly singleline: boolean) {}

  stops = this.singleline ? ["\n", "\n# "] : ["\n# "];

  makePrimer() {
    return `# Question\n\n`;
  }

  makeInvitation(): string {
    return `\n\n# Answer\n\n${
      this.singleline
        ? "Write a single one-line answer to the above question. Use the format\n\nANSWER: <answer>\n\nWrite your answer below.\n\nANSWER: "
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
  formatInstructions: string,
  question: string,
  ct: ICancellationToken
): Promise<string> {
  const questionWithFormatInstructions =
    formatInstructions + "\n\n### Text of question\n\n" + question;
  if (ctxt.arith) {
    console.log(`[${id}]: Generating numeric calculation code...`);
    const strategy = new WriteArithmeticStrategy(question, ctxt);
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
    let arithmeticCode: string;
    let arithmeticResults: string;
    try {
      arithmeticCode = completionAttempt.result;
      console.log(`---------------- [${id}] calculations, question: ${question} ----------------`);
      console.log(arithmeticCode);
      if (arithmeticCode.includes("=> {") || arithmeticCode.includes("  return ")) {
        throw new Error("FILTER: Lambda functions and returns not allowed");
      }

      console.log(`[${id}]: Evaluating calculations...`);
      const arithmeticResultsObject: any = eval("(() => { \n" + arithmeticCode + "})()");

      arithmeticResults = JSON.stringify(arithmeticResultsObject, null, 2);

      console.log(`---------------- [${id}] numeric calculation results ----------------`);
      console.log(arithmeticResults);

      // see if check_message property is present in the object
      if (
        // eslint-disable-next-line no-prototype-builtins
        arithmeticResultsObject.hasOwnProperty("check_message") &&
        arithmeticResultsObject.check_message
      ) {
        throw new Error(
          "FILTER: Correctness check failed: " + arithmeticResultsObject.check_message
        );
      }
    } catch (e) {
      console.error(colors.red(`[${id}]: Error evaluating calculations: ${e}`));
      console.log(colors.red(`[${id}]: Error evaluating calculations: ${e}`));
      arithmeticCode = "";
      arithmeticResults = "";
    }

    console.log(`[${id}]:Generating answer...`);
    const strategy2 = new AskQuestionStrategy(questionWithFormatInstructions, ctxt.singleline);
    const completionAttempt2 = await completions.getOneUnstreamedCompletion(
      ctxt,
      strategy2.makePrimer() +
        strategy2.question +
        (!ctxt.noIncludeCodeInFinalQuestion && arithmeticCode
          ? "\n\n### Calculations\n\n" + arithmeticCode
          : "") +
        (arithmeticResults ? "\n\n### Calculation results\n\n" + arithmeticResults : "") +
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
    const strategy = new AskQuestionStrategy(questionWithFormatInstructions, ctxt.singleline);
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
