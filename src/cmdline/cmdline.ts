import async from "async";
import colors from "colors/safe";
import * as options from "../engine/options";
import { buildEngineContext } from "../engine/context";
import * as local_cache from "../engine/local-cache";
import { NeverCancelledToken } from "../util/cancellation";
import { ask } from "../jobs/ask";
import { exit } from "process";
import { Services } from "../engine/services";
import * as fs from "fs";
import { readFileSync } from "fs";
import * as xml_parser from "fast-xml-parser";

// Slice the initial arguments
const myArgs = process.argv.slice(2);

async function main() {
  if (process.stdout.isTTY) {
    colors.enable();
  } else {
    colors.disable();
  }
  // We never cancel command line requests
  const ct = new NeverCancelledToken();

  const args = await options.spec("gpt4e", options.modeOptions("cli"), "strict").parse(myArgs);
  const allOptions = options.getOptions(args, "cli");
  console.log(allOptions);
  if (args._.includes("ask")) {
    const services = await Services.create();
    const options = {
      ...(await buildEngineContext(services, allOptions.ask)),
      ...allOptions.ask,
    };
    const prefix = "ask";
    const question: string = options.question
      ? options.question
      : options.questionfile
      ? fs.readFileSync(options.questionfile, "utf8")
      : fail("No question provided");
    local_cache.loadLocalCache(options, prefix);
    const answer = await ask(options, "1", question, ct);
    console.log(options.workListener.toString());
    console.log(colors.green(answer));
    local_cache.writeLocalCache(options);
  } else if (args._.includes("eval")) {
    const services = await Services.create();
    const options = {
      ...(await buildEngineContext(services, allOptions.eval)),
      ...allOptions.eval,
      question: "",
      questionfile: "",
      singleline: true,
    };
    const prefix = "eval";
    local_cache.loadLocalCache(options, prefix);

    const xml = readFileSync("test/dataset/ASDiv.xml", "utf8");
    // Parse the XML including attributes
    const parser = new xml_parser.XMLParser({ ignoreAttributes: false });
    const json = parser.parse(xml);

    const problems = json["Machine-Reading-Corpus-File"].ProblemSet.Problem;
    let yes = 0;
    let count = 0;
    // Do a parallel map over the problems

    await mapControlled<any, any>(options, problems, async (problem) => {
      const body: string = problem.Body;
      const question: string = problem.Question.toString();
      const expected: string = problem.Answer.toString();
      const id: string = problem["@_ID"];
      const grade: string = problem["@_Grade"];
      const type: any = problem["Solution-Type"];
      const type_text: string = typeof type === "string" ? type : type["#text"];

      // log the type of Answer
      console.log(`[${id}] question: ${body} ${question}`);
      console.log(`[${id}] expected answer: ${expected}`);
      const result = await ask(
        options,
        id,
        `### Instructions

Answer the question below a format like the following, giving a unit if appropriate:
  931
  49 (oranges)
  Mr.Jones
  1.37 (dollars)
  154 (cents)
  185 (minutes)
  Yes
  No

If asked to write a ratio, write ratios in form 'N:M' and reduce ratios to simplest form.
Do not write a sentence, just give the answer in one of the above formats. Do not give multiple answers.

### Text of question

${body} ${question}`,
        ct
      );
      console.log(`[${id}] actual answer: ${result}`);
      let correct = false;
      if (result) {
        // check if the integer or decimal numbers in the answer match the numbers in the expected answer by extracting them
        // using regular expressions, and comparing them, not caring about the order they occur in

        const expected_match = expected.match(/(\d(\d|,\d)*(\.\d(\d|,\d)*)?)/g);
        const result_match = result.match(/(\d(\d|,\d)*(\.\d(\d|,\d)*)?)/g);
        if (expected_match && result_match) {
          const result_numbers = result_match.sort();
          const expected_numbers = expected_match.sort();
          console.log(`[${id}]: result_numbers: ${result_numbers}`);
          console.log(`[${id}]: expected_numbers: ${expected_numbers}`);
          correct =
            expected_numbers.length == result_numbers.length &&
            expected_numbers.every(
              (v, i) =>
                // remove commas and parse to numbers and compare
                parseFloat(v.replace(/,/g, "")) == parseFloat(result_numbers[i].replace(/,/g, ""))
            );
        } else {
          correct = result.trim() == expected.trim();
        }
      }

      if (correct) {
        yes++;
      } else {
        console.log(
          `FAIL: [${id}, grade ${grade}, type ${type_text}], expected: "${expected}", actual: "${result}", question: ${body} ${question}`
        );
      }
      count++;
      console.log(`yes: ${yes}, count: ${count}, accuracy: ${yes / count}`);
      local_cache.writeLocalCache(options);
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
