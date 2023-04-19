import colors from "colors/safe";
import * as options from "../engine/options";
import { buildEngineContext } from "../engine/context";
import * as local_cache from "../engine/local-cache";
import { NeverCancelledToken } from "../util/cancellation";
import { ask } from "../jobs/ask";
import { exit } from "process";
import { Services } from "../engine/services";
import * as fs from "fs";

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
    const answer = await ask(options, question, ct);
    console.log(options.workListener.toString());
    console.log(colors.green(answer));
    local_cache.writeLocalCache(options);
  }
  exit(0);
}

if (process.argv[0].indexOf("node") != -1) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
