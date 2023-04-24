import yargs from "yargs/yargs";
import { parseBoolean, parseNumber } from "../util/util";

export const botActionChoices = ["ask", "eval"] as const;

export type Command = {
  input: string;
  options: Options;
  output: string;
  errors: string | undefined;
  otherText: string;
  action?: BotAction;
};

export type BotAction = (typeof botActionChoices)[number];

export const modeChoices = ["public", "everything", "staging", "cli", "gentest"] as const;
export type Mode = (typeof modeChoices)[number];

const keysArgs = {
  aoaiApiKey: {
    description: "The API key to use for next-model2 (deprecated).",
    type: "string",
    modes: ["everything", "cli"],
  },
  openaiApiKey: {
    description: "The API key to use for Open AI endpoints.",
    type: "string",
    modes: ["everything", "cli"],
  },
  aipApiKey: {
    description: "The API key to use for AIP endpoints.",
    type: "string",
    modes: ["everything", "cli"],
  },
  copilotPlaygroundApiKey: {
    description: "The API key to use for Copilot Playground endpoints.",
    type: "string",
    modes: ["everything", "cli"],
  },
  nextModel2ApiKey: {
    description: "The API key to use for Next Model 2 endpoints.",
    type: "string",
    modes: ["everything", "cli"],
  },
  nextModel3ApiKey: {
    description: "The API key to use for Next Model 3 endpoints.",
    type: "string",
    modes: ["everything", "cli"],
  },
};

const modelSelectionArgs = {
  model: {
    description: "The model to use",
    type: "string",
    modes: ["everything", "cli"],
    defaults: {
      all: "next-model2",
      public: "next-model3", // use the production model instance for public installs
    },
  },
};

const parallelismArgs = {
  deterministic: {
    description: "Do not run actions in parallel, to help make output to stdout deterministic.",
    type: "boolean",
    modes: ["everything", "cli"],
    defaults: { all: false },
  },
  maxConcurrency: {
    description: "The maximum number of concurrent requests to make to the GitHub API",
    type: "number",
    modes: ["everything", "cli"],
    defaults: { all: 30 },
  },
};

const modelRetryArgs = {
  retryCount: {
    description: "The number of times to retry a failed request",
    type: "number",
    modes: ["everything", "cli"],
    defaults: { all: 3, cli: 20 },
  },
  retryBackoffFactor: {
    description: "The factor by which to increase the delay between retries",
    type: "number",
    modes: ["everything", "cli"],
    defaults: { all: 1, cli: 1.2 },
  },
  retryInitialDelay: {
    description: "The initial delay (in ms) for retrying a failed request",
    type: "number",
    modes: ["everything", "cli"],
    defaults: { all: 1000, cli: 2000 },
  },
};

const commonEngineArgs = {
  ...keysArgs,
  ...parallelismArgs,
  ...modelRetryArgs,
  ...modelSelectionArgs,
  verbose: {
    description: "Enable verbose logging",
    type: "boolean",
    modes: ["everything", "cli"],
    defaults: { all: false },
  },
  raiPolicyId: {
    description: "The policy id to use for RAI content filtering. Use 'nil' to disable filtering",
    type: "string",
    modes: ["everything", "cli"],
    defaults: {
      all: "112",
    },
  },
  useLocalCache: {
    description: "Use the local request cache for requests.",
    type: "boolean",
    modes: ["cli"],
    defaults: { all: false, cli: true },
  },
  temperature: {
    description:
      "The temperature to use when generating completions. Higher means more likely to find a completion different to the existing text",
    type: "number",
    modes: ["everything", "cli"],
    defaults: { all: 0 },
  },
};
const commonAskArgs = {
  arith: {
    description: "Use arithmetic equip",
    type: "boolean",
    default: true,
    modes: ["cli"],
  },
  noEmitComparisons: {
    description: "Don't emit comparisons",
    type: "boolean",
    default: true,
    modes: ["cli"],
  },
  noEliminateDateTime: {
    description: "Don't request the reduction of date/time to minutes, hours, etc.",
    type: "boolean",
    default: true,
    modes: ["cli"],
  },
  noSuppressArbitraryCode: {
    description: "Don't suppress the generation of arbitrary code like lambdas and loops",
    type: "boolean",
    default: true,
    modes: ["cli"],
  },
  emitChecks: {
    description: "Emit checks",
    type: "boolean",
    default: true,
    modes: ["cli"],
  },
  noEmitUnits: {
    description: "Don't include units in the comments of the calculation code",
    type: "boolean",
    default: true,
    modes: ["cli"],
  },
  noEmitDescriptions: {
    description: "Don't include descriptions in comments of the calculation code",
    type: "boolean",
    default: true,
    modes: ["cli"],
  },
  noIncludeCodeInFinalQuestion: {
    description:
      "Don't include the calculation code in the final question prompt, only the answers",
    type: "boolean",
    default: true,
    modes: ["cli"],
  },
};

const askArgs = {
  ...commonEngineArgs,
  ...commonAskArgs,
  question: {
    description: "The question to ask",
    type: "string",
    default: true,
    modes: ["cli"],
  },
  questionfile: {
    description: "The file containing the question to ask",
    type: "string",
    default: true,
    modes: ["cli"],
  },
  singleline: {
    description: "Request a single line answer?",
    type: "boolean",
    default: false,
    modes: ["cli"],
  },
};

const evalArgs = {
  ...commonEngineArgs,
  ...commonAskArgs,
  questionset: {
    description: "The set of questions to use",
    type: "string",
    default: "ASDiv",
    modes: ["cli"],
  },
  questions: {
    description: "The identifiers of the questions to run",
    type: "string",
    default: "",
    modes: ["cli"],
  },
};

const modeOptionsTemplate = {
  ask: {
    description: "Ask a question",
    arguments: askArgs,
    modes: ["cli", "everything"],
  },
  eval: {
    description: "Evaluate performance on a set of questions",
    arguments: evalArgs,
    modes: ["cli", "everything"],
  },
  help: {
    description: "Comments with a help message",
    arguments: [],
    modes: ["cli", "everything"],
  },
};

type ArgumentOptions = {
  description: string;
  type: "string" | "number" | "boolean" | "array";
  choices?: string[];
  default?: string | number | boolean | string[];
  demand?: boolean;
  array?: boolean;
};

type Arguments = {
  [key: string]: ArgumentOptions;
};

type CommandSpec = {
  description: string;
  arguments: Arguments;
};

type ModeOptions = {
  [key in BotAction]+?: CommandSpec;
};

/**
 * Specializes the template for a particular mode into the form for argument parsing.
 *
 * Any commands or arguments which are not valid for this mode are excluded from the result.
 */
export function modeOptions(mode: Mode): ModeOptions {
  const modeOptions: ModeOptions = {};
  for (const [action, commandSpecTemplate] of Object.entries(modeOptionsTemplate)) {
    if (commandSpecTemplate.modes.includes(mode)) {
      const args: Arguments = {};
      for (const [arg, options] of Object.entries(commandSpecTemplate.arguments)) {
        if (options.modes.includes(mode)) {
          args[arg] = {
            description: options.description,
            type: (options as any).type,
            choices: (options as any).choices,
            default: (options as any).defaults
              ? (options as any).defaults[mode] ?? (options as any).defaults["all"]
              : undefined,
            demand: (options as any).demand,
            array: (options as any).array,
          };
        }
      }
      modeOptions[action as BotAction] = {
        description: commandSpecTemplate.description,
        arguments: args,
      };
    }
  }
  return modeOptions;
}

// Parse the arguments for the command line or bot invocation
export function spec(
  scriptName: string,
  modeOptions: ModeOptions,
  strict: "not-strict" | "strict"
) {
  let y = yargs().parserConfiguration({});
  for (const [action, commandSpec] of Object.entries(modeOptions)) {
    let a = action;
    // if any of the entries are required then make them positional
    for (const [arg, options] of Object.entries(commandSpec.arguments)) {
      if (options["demand"] === true) {
        a += ` [${arg}]`;
      }
    }
    y = y.command(a, commandSpec.description, commandSpec.arguments);
  }
  if (strict === "strict") {
    y = y.strict();
  }
  return y.exitProcess(false).help().scriptName(scriptName);
}

type ExpandedArguments<T extends { arguments: any }> = { [P in keyof T["arguments"]]: any };
type Expanded<T extends { [P in keyof T]: { arguments: any } }> = {
  [Command in keyof T]: ExpandedArguments<T[Command]>;
};

/** useful types */

/**
 * The type Options is the type of specialized template once its been expanded
 * for a particular mode, arguments, default values and environment variables.
 */
export type Options = Expanded<typeof modeOptionsTemplate>;

/**
 * The type CommonEngineOptions is the subset of Options which are common to all
 * modes.
 */
export type CommonEngineOptions = { [P in keyof typeof commonEngineArgs]: any };

/**
 * The type CommonBotOptions is the subset of Options which pertain to choice
 * of which model to use.
 */
export type ModelChoiceOption = keyof typeof modelSelectionArgs;

/**
 * The type ApiKeyOption is the subset of Options which pertain to setting
 * the API keys for different models.
 */
export type ApiKeyOption = keyof typeof keysArgs;

/**
 * The type ModelRetryOption is the subset of Options which pertain to
 * retrying the model.
 */
export type ModelRetryOption = { [P in keyof typeof modelRetryArgs]: any };

/** The variable apiKeyOptions is the list of all the options which are API keys */
export const apiKeyOptions = Object.keys(keysArgs) as ApiKeyOption[];

/**
 * This function takes the parsed command line arguments, and the mode, and
 * expands the template for the mode into the form for using as a context object.
 * All commands and arguments are retained and given a value which is
 * (in order of highest priority first): taken from the environment variable, taken
 * from the command line arguments, taken from the default in the template for the
 * chosen mode.
 */
export function getOptions(argv: any, mode: Mode): Options {
  const options = {} as Options;
  for (const [action, commandSpecTemplate] of Object.entries(modeOptionsTemplate)) {
    const args: any = {};
    for (const [arg, options] of Object.entries(commandSpecTemplate.arguments)) {
      const deflt = (options as any).defaults
        ? (options as any).defaults[mode] ?? (options as any).defaults["all"]
        : undefined;

      // convert arg from camelCase to capitals with underscores
      const env = process.env[arg.replace(/([A-Z])/g, "_$1").toUpperCase()];

      let commandLine = argv ? argv[arg] : undefined;

      // if there are no instances of an array argument then yargs is returning
      // an array containing a single undefined element - strip it here
      if (Array.isArray(commandLine)) {
        commandLine = commandLine.filter((x: any) => x !== undefined);
      }

      args[arg] = env ?? commandLine ?? deflt;

      if (options.type === "boolean") {
        args[arg] = parseBoolean(args[arg]);
      } else if (options.type === "number") {
        args[arg] = parseNumber(args[arg]);
      }
    }
    options[action as BotAction] = args;
  }
  return options;
}
