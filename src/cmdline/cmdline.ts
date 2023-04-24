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

type Problem = {
  id: string;
  question: string;
  expected: string;
  grade: string;
  kind: string;
};

const calcProblems: Problem[] = [
  {
    id: "calc-0001",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of adding -942.12 and 1441.23? Give answer rounded to two decimal places.",
    expected: (-942.12 + 1441.23).toFixed(2),
  },
  {
    id: "calc-0002",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of multiplying -942.12 by 1441.23?  Give answer rounded to two decimal places.",
    expected: (-942.12 * 1441.23).toFixed(2),
  },
  {
    id: "calc-0003",
    grade: "6",
    kind: "decimal calculation",
    question: "What is the square root of 1441.23?  Give answer rounded to two decimal places.",
    expected: Math.sqrt(1441.23).toFixed(2),
  },
  {
    id: "calc-0004",
    grade: "6",
    kind: "decimal calculation",
    question: "What is the absolute value of -942.12?  Give answer rounded to two decimal places.",
    expected: Math.abs(-942.12).toFixed(2),
  },
  {
    id: "calc-0005",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the mean of -942.12 and 1441.23?  Give answer rounded to two decimal places.",
    expected: ((-942.12 + 1441.23) / 2).toFixed(2),
  },
  {
    id: "calc-0006",
    grade: "6",
    kind: "decimal calculation",
    question: "What is the sign of -942.12?  Give answer rounded to two decimal places.",
    expected: Math.sign(-942.12).toFixed(2),
  },
  {
    id: "calc-0007",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of calculating e raised to the power of 2?  Give answer rounded to two decimal places.",
    expected: Math.exp(2).toFixed(2),
  },
  {
    id: "calc-0008",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the natural logarithm of 1441.23?  Give answer rounded to two decimal places.",
    expected: Math.log(1441.23).toFixed(2),
  },
  {
    id: "calc-0009",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of calculating sine of -1.12?  Give answer rounded to two decimal places.",
    expected: Math.sin(-1.12).toFixed(2),
  },
  {
    id: "calc-0010",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of calculating cosine of 1.23?  Give answer rounded to two decimal places.",
    expected: Math.cos(1.23).toFixed(2),
  },
  {
    id: "calc-0011",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of calculating tangent of -1.12?  Give answer rounded to two decimal places.",
    expected: Math.tan(-1.12).toFixed(2),
  },
  {
    id: "calc-0012",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of calculating arctangent of 1.23?  Give answer in radians rounded to two decimal places.",
    expected: Math.atan(1.23).toFixed(2),
  },
  {
    id: "calc-0013",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of calculating arccosine of 0.12?  Give answer in radians rounded to two decimal places.",
    expected: Math.acos(0.12).toFixed(2),
  },
  {
    id: "calc-0014",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of calculating arcsine of 0.23?  Give answer in radians rounded to two decimal places.",
    expected: Math.asin(0.23).toFixed(2),
  },
  {
    id: "calc-0015",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of adding -942 and 1441?  Give answer rounded to two decimal places.",
    expected: (-942 + 1441).toFixed(2),
  },
  {
    id: "calc-0016",
    grade: "6",
    kind: "decimal calculation",
    question: "Calculate (2^3)^(2^2)",
    expected: ((2 ** 3) ** (2 ** 2)).toFixed(2),
  },
  {
    id: "calc-0017",
    grade: "6",
    kind: "decimal calculation",
    question: "Calculate (2^3)^4",
    expected: ((2 ** 3) ** 4).toFixed(2),
  },
  {
    id: "calc-0018",
    grade: "6",
    kind: "decimal calculation",
    question: "Calculate (2*3)^4",
    expected: ((2 * 3) ** 4).toFixed(2),
  },
  {
    id: "calc-0019",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of adding 6.42 and -4.2?  Give answer rounded to two decimal places.",
    expected: (6.42 + -4.2).toFixed(2),
  },
  {
    id: "calc-0020",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of subtracting 8.1 from 17.3?  Give answer rounded to two decimal places.",
    expected: (17.3 - 8.1).toFixed(2),
  },
  {
    id: "calc-0021",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the result of multiplying -0.04 by 6.42?  Give answer rounded to two decimal places.",
    expected: (-0.04 * 6.42).toFixed(2),
  },
  {
    id: "calc-0022",
    grade: "6",
    kind: "decimal calculation",
    question: "What is the square root of 17.3?  Give answer rounded to two decimal places.",
    expected: Math.sqrt(17.3).toFixed(2),
  },
  {
    id: "calc-0023",
    grade: "6",
    kind: "decimal calculation",
    question: "What is the absolute value of -4.2?  Give answer rounded to two decimal places.",
    expected: Math.abs(-4.2).toFixed(2),
  },
  {
    id: "calc-0024",
    grade: "6",
    kind: "decimal calculation",
    question: "What is the natural logarithm of 8.1?  Give answer rounded to two decimal places.",
    expected: Math.log(8.1).toFixed(2),
  },
  {
    id: "calc-0025",
    grade: "6",
    kind: "decimal calculation",
    question: "What is the sine of -0.04?  Give answer rounded to two decimal places.",
    expected: Math.sin(-0.04).toFixed(2),
  },
  {
    id: "calc-0026",
    grade: "6",
    kind: "decimal calculation",
    question: "What is the cosine of 6.42?  Give answer rounded to two decimal places.",
    expected: Math.cos(6.42).toFixed(2),
  },
  {
    id: "calc-0027",
    grade: "6",
    kind: "decimal calculation",
    question: "What is the tangent of -4.2?  Give answer rounded to two decimal places.",
    expected: Math.tan(-4.2).toFixed(2),
  },
  {
    id: "calc-0028",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the arctangent of 17.3?  Give answer in radians rounded to two decimal places.",
    expected: Math.atan(17.3).toFixed(2),
  },
  {
    id: "calc-0029",
    grade: "6",
    kind: "decimal calculation",
    question:
      "What is the arccosine of -0.04?  Give answer in radians rounded to two decimal places.",
    expected: Math.acos(-0.04).toFixed(2),
  },
  {
    id: "calc-0030",
    grade: "6",
    kind: "decimal calculation",
    question: "What is the arcsine of 0.1?  Give answer in radians rounded to two decimal places.",
    expected: Math.asin(0.1).toFixed(2),
  },
  {
    id: "calc-0031",
    grade: "6",
    kind: "decimal calculation",
    question: "What is 6 raised to power 8.  Give answer rounded to two decimal places.",
    expected: (6 ** 8).toFixed(2),
  },
  {
    id: "calc-0032",
    grade: "6",
    kind: "decimal calculation",
    question: "What is e raised to power pi/2.  Give answer rounded to two decimal places.",
    expected: Math.exp(Math.PI / 2).toFixed(2),
  },
  {
    id: "calc-0033",
    grade: "6",
    kind: "decimal calculation",
    question: "What is pi/2 raised to power e.  Give answer rounded to two decimal places.",
    expected: ((Math.PI / 2) ** Math.E).toFixed(2),
  },
  {
    id: "calc-0034",
    grade: "6",
    kind: "decimal calculation",
    question: "What is e raised to power pi.  Give answer rounded to two decimal places.",
    expected: Math.exp(Math.PI).toFixed(2),
  },
  {
    id: "calc-0035",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is 0.31 plus 0.21 greater than 0.11 plus 0.99? Answer "true" or "false" without quotes.',
    expected: (0.31 + 0.21 > 0.11 + 0.99).toString(),
  },
  {
    id: "calc-0036",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is 0.56 minus 0.23 less than or equal to 0.78 divided by 0.34? Answer "true" or "false" without quotes.',
    expected: (0.56 - 0.23 <= 0.78 / 0.34).toString(),
  },
  {
    id: "calc-0037",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is 0.67 times 0.45 not equal to 0.23 plus 0.54? Answer "true" or "false" without quotes.',
    expected: (0.67 * 0.45 != 0.23 + 0.54).toString(),
  },
  {
    id: "calc-0038",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is 0.89 divided by 0.12 greater than or equal to 0.34 minus 0.12? Answer "true" or "false" without quotes.',
    expected: (0.89 / 0.12 >= 0.34 - 0.12).toString(),
  },
  {
    id: "calc-0039",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is 0.45 plus 0.67 less than or equal to 1 minus (1/3)? Answer "true" or "false" without quotes.',
    expected: (0.45 + 0.67 <= 1 - 1 / 3).toString(),
  },
  {
    id: "calc-0040",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is (1/2) times (1/3) less than or equal to (1/4) plus (1/8)? Answer "true" or "false" without quotes.',
    expected: ((1 / 2) * (1 / 3) <= 1 / 4 + 1 / 8).toString(),
  },
  {
    id: "calc-0041",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is (1/5) divided by (1/7) greater than or equal to (1/6) minus (1/8)? Answer "true" or "false" without quotes.',
    expected: (1 / 5 / (1 / 7) >= 1 / 6 - 1 / 8).toString(),
  },
  {
    id: "calc-0042",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is (2/3) times (3/4) greater than or equal to (5/6) minus (7/8)? Answer "true" or "false" without quotes.',
    expected: ((2 / 3) * (3 / 4) >= 5 / 6 - 7 / 8).toString(),
  },
  {
    id: "calc-0043",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is (9/10) divided by (7/10) less than or equal to (5/6) plus (7/8)? Answer "true" or "false" without quotes.',
    expected: (9 / 10 / (7 / 10) <= 5 / 6 + 7 / 8).toString(),
  },
  {
    id: "calc-0044",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is sqrt(2)/2 times sqrt(3)/3 less than or equal to sqrt(5)/5 plus sqrt(7)/7? Answer "true" or "false" without quotes.',
    expected: (
      ((Math.sqrt(2) / 2) * Math.sqrt(3)) / 3 <=
      Math.sqrt(5) / 5 + Math.sqrt(7) / 7
    ).toString(),
  },
  {
    id: "calc-0045",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is sqrt(11)/11 divided by sqrt(13)/13 greater than or equal to sqrt(17)/17 minus sqrt(19)/19? Answer "true" or "false" without quotes.',
    expected: (
      Math.sqrt(11) / 11 / (Math.sqrt(13) / 13) >=
      Math.sqrt(17) / 17 - Math.sqrt(19) / 19
    ).toString(),
  },
  {
    id: "calc-0046",
    grade: "6",
    kind: "decimal comparison",
    question:
      'Is sqrt(23)/23 times sqrt(29)/29 greater than or equal to sqrt(31)/31 minus sqrt(37)/37? Answer "true" or "false" without quotes.',
    expected: (
      ((Math.sqrt(23) / 23) * Math.sqrt(29)) / 29 >=
      Math.sqrt(31) / 31 - Math.sqrt(37) / 37
    ).toString(),
  },
  {
    id: "calc-0047",
    grade: "6",
    kind: "integer comparison",
    question: 'Is 31 plus 210 greater than 11 plus 99? Answer "true" or "false" without quotes.',
    expected: (31 + 210 > 11 + 99).toString(),
  },
  {
    id: "calc-0048",
    grade: "6",
    kind: "integer comparison",
    question:
      'Is 100 divided by 5 less than or equal to 20? Answer "true" or "false" without quotes.',
    expected: (100 / 5 <= 20).toString(),
  },
  {
    id: "calc-0049",
    grade: "6",
    kind: "integer comparison",
    question:
      'Is 999 minus 888 greater than or equal to 100? Answer "true" or "false" without quotes.',
    expected: (999 - 888 >= 100).toString(),
  },
  {
    id: "calc-0050",
    grade: "6",
    kind: "integer comparison",
    question: 'Is 50 times 10 not equal to 500? Answer "true" or "false" without quotes.',
    expected: (50 * 10 != 500).toString(),
  },
  {
    id: "calc-0051",
    grade: "6",
    kind: "integer comparison",
    question:
      'Is 999 divided by 3 less than or equal to 333? Answer "true" or "false" without quotes.',
    expected: (999 / 3 <= 333).toString(),
  },
];
//console.log(problems);

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
    const answer = await ask(options, "1", "", question, ct);
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
    const questions: string = options.questions || "";
    local_cache.loadLocalCache(options, prefix);

    let problems: Problem[];
    if (options.questionset == "ASDiv") {
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
      problems = calcProblems;
    } else {
      fail("Unknown question set");
    }

    let yes = 0;
    let count = 0;
    // Do a parallel map over the problems

    await mapControlled<Problem, any>(options, problems, async (problem) => {
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

If asked to write a ratio, write ratios in form 'N:M' and reduce ratios to simplest form.
Do not write a sentence, just give the answer in one of the above formats. Do not give multiple answers.`;
          const result = await ask(options, problem.id, format, problem.question, ct);
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
