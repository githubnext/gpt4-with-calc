import async from "async";
import colors from "colors/safe";
import * as options from "../engine/options";
import { buildEngineContext } from "../engine/context";
import * as local_cache from "../engine/local-cache";
import { ask } from "../jobs/ask";
import { exit } from "process";
import { Fetcher } from "../engine/fetcher";
import * as fs from "fs";
import * as calc from "../problems/calc";
import * as finance from "../problems/finance";
import * as tables from "../problems/tables";
import * as dates from "../problems/dates";
import * as units from "../problems/units";
import { readFileSync } from "fs";
import * as xml_parser from "fast-xml-parser";
import { fail } from "assert";

// Slice the initial arguments
const myArgs = process.argv.slice(2);

async function main() {
  if (process.stdout.isTTY) {
    colors.enable();
  } else {
    colors.disable();
  }
  const args = await options.spec("gpte", options.modeOptions("cli"), "strict").parse(myArgs);
  const allOptions = options.getOptions(args, "cli");
  console.log(allOptions);
  if (args._.includes("ask")) {
    const fetcher = await Fetcher.create();
    const options = {
      ...(await buildEngineContext(fetcher, allOptions.ask)),
      ...allOptions.ask,
    };
    const prefix = "ask";
    const question: string = options.question
      ? options.question
      : options.questionfile
      ? fs.readFileSync(options.questionfile, "utf8")
      : fail("No question provided");
    local_cache.loadLocalCache(options, prefix);
    const answer = await ask(options, "1", "", question);
    console.log(options.workListener.toString());
    console.log(colors.green(answer));
    local_cache.writeLocalCache(options);
  } else if (args._.includes("eval")) {
    const fetcher = await Fetcher.create();
    const options = {
      ...(await buildEngineContext(fetcher, allOptions.eval)),
      ...allOptions.eval,
      question: "",
      questionfile: "",
      singleline: true,
    };
    const prefix = "eval";
    const questions: string = options.questions || "";
    local_cache.loadLocalCache(options, prefix);

    let problems: calc.Problem[];
    if (options.questionset == "puzzles") {
      const xml = readFileSync("test/dataset/ASDiv.xml", "utf8");
      // Parse the XML including attributes
      const parser = new xml_parser.XMLParser({ ignoreAttributes: false });
      const json = parser.parse(xml);
      problems = json["Machine-Reading-Corpus-File"].ProblemSet.Problem.map((problem: any) => {
        const body: string = problem.Body;
        const questionLine: string = problem.Question.toString();
        const expected: string = problem.Answer.toString();
        const grade: string = problem["@_Grade"];
        const type: any = problem["Solution-Type"];
        const kind: string = typeof type === "string" ? type : type["#text"];
        const id: string = problem["@_ID"];
        const question = `${body} ${questionLine}`;
        return { id, question, expected, grade, kind: kind };
      });
    } else if (options.questionset == "calc") {
      problems = calc.getProblems();
    } else if (options.questionset == "finance") {
      problems = finance.getProblems();
    } else if (options.questionset == "tables") {
      problems = tables.getProblems();
    } else if (options.questionset == "dates") {
      problems = dates.getProblems();
    } else if (options.questionset == "units") {
      problems = units.getProblems();
    } else {
      throw new Error("Unknown question set");
    }

    let yes = 0;
    let count = 0;
    // Do a parallel map over the problems

    await mapControlled<calc.Problem, any>(options, problems, async (problem) => {
      try {
        if (!questions || questions.includes(problem.id)) {
          console.log(`[${problem.id}] question: ${problem.question}`);
          console.log(`[${problem.id}] expected: ${problem.expected}`);
          const format = `Answer the question below using a format like the following, giving a unit if appropriate:
  931
  49 (oranges)
  Mr.Jones
  1.37 (dollars)
  154 (cents)
  185 (minutes)
  Yes
  No
  true
  false

If asked to write a ratio, write ratios in form 'N:M' and reduce ratios to simplest form.
Do not write a sentence, just give the answer in one of the above formats. Do not give multiple answers.`;
          const result = await ask(options, problem.id, format, problem.question);
          console.log(`[${problem.id}] actual expected: ${result}`);
          let correct = false;
          if (result) {
            // check if the integer or decimal numbers in the answer match the numbers in the expected answer by extracting them
            // using regular expressions, and comparing them, not caring about the order they occur in

            const expected_match = problem.expected.match(/(\d(\d|,\d)*(\.\d(\d|,\d)*)?)/g);
            const result_match = result.match(/(\d(\d|,\d)*(\.\d(\d|,\d)*)?)/g);
            if (expected_match && result_match) {
              const result_numbers = result_match.sort();
              const expected_numbers = expected_match.sort();
              console.log(`[${problem.id}]: result_numbers: ${result_numbers}`);
              console.log(`[${problem.id}]: expected_numbers: ${expected_numbers}`);
              correct =
                expected_numbers.length == result_numbers.length &&
                expected_numbers.every(
                  (v, i) =>
                    // remove commas and parse to numbers and compare
                    parseFloat(v.replace(/,/g, "")) ==
                    parseFloat(result_numbers[i].replace(/,/g, ""))
                );
            } else {
              const resultTrim = result.trim();
              const expectedTrim = problem.expected.trim();
              // do a case insensitive comparison
              correct = resultTrim.toLowerCase() == expectedTrim.toLowerCase();
            }
          }

          if (correct) {
            yes++;
            console.log(
              `CORRECT: [${problem.id}, grade ${problem.grade}, type ${problem.kind}], expected: "${problem.expected}", actual: "${result}", question: ${problem.question}`
            );
          } else {
            console.log(
              `FAIL: [${problem.id}, grade ${problem.grade}, type ${problem.kind}], expected: "${problem.expected}", actual: "${result}", question: ${problem.question}`
            );
          }
          count++;
          console.log(`yes: ${yes}, count: ${count}, accuracy: ${yes / count}`);
          local_cache.writeLocalCache(options);
        }
      } catch (e) {
        console.error(`ERROR: [${problem.id}], error: ${e}`);
        console.log(`ERROR: [${problem.id}], error: ${e}`);
      }
    });
  }
  exit(0);
}

if (process.argv[0].indexOf("node") != -1) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}

export async function mapControlled<T, U>(
  options: { deterministic: boolean },
  inputs: T[],
  fn: (input: T, index: number) => Promise<U>
): Promise<U[]> {
  const indexedInputs = inputs.map((input, index) => ({ value: input, index }));
  if (options.deterministic) {
    return async.mapSeries(
      indexedInputs,
      async.asyncify(async (input: { value: T; index: number }) => fn(input.value, input.index))
    );
  } else {
    return async.map(
      indexedInputs,
      async.asyncify(async (input: { value: T; index: number }) => fn(input.value, input.index))
    );
  }
}
