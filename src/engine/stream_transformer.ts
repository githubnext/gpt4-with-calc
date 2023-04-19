import { Transform, TransformCallback } from "stream";
import * as promptlib from "copilot-promptlib";
import { WorkListener } from "./work_listener";

import * as debugModule from "debug";
const debug = debugModule.debug("prbot:stream_transformer");

export type Token = {
  completionIndex: number;
  text: string;
  logProb?: number;
  token?: string;
  topToken?: string;
  tokenOffsetInText?: number;
  tokenCount: number;
};

export class FilterCompletion extends Transform {
  constructor(readonly completionIndex: number) {
    super({ readableObjectMode: true, writableObjectMode: true });
  }

  _transform(chunk: Token, _encoding: BufferEncoding, callback: TransformCallback): void {
    if (chunk.completionIndex === this.completionIndex) {
      this.push(chunk);
    }
    callback();
  }
}

export class SSEToTokens extends Transform {
  buf = "";
  totalTokens = 0;
  aborted = false;

  constructor(readonly workListener: WorkListener) {
    // this specifies that the transfomer reads from a stream that is
    // _not in object mode_ and writes to a stream that _is_ in object mode
    // (these names feel the wrong way round to me)
    super({ readableObjectMode: true, writableObjectMode: false });
  }

  override _transform(chunk: Buffer, _encoding: string, callback: TransformCallback) {
    if (this.aborted) {
      callback();
      return;
    }
    this.buf += chunk.toString("utf8");
    const lines = this.buf.split("\n");

    // iterate over all but the last line
    // "a\nb\n" splits into ["a", "b", ""]
    // this is the behaviour we want so that if the chunk ends with a newline
    // we will parse the whole of that line this time around
    let err = null;
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      if (line.trim() != "data: [DONE]" && line.startsWith("data: ")) {
        const message = JSON.parse(line.substring("data: ".length));
        if (message.error) {
          debug(
            "Found error message when expecting completion data. Sending empty token stream: %s",
            message.error
          );
          this.push(null);
          this.aborted = true;
          callback();
          return;
        }
        for (const choice of message.choices) {
          const completionIndex = choice.index;

          choice.text = SSEToTokens.replaceUnicode(choice.text);

          type LogProbInfo = {
            token: string;
            logProb: number;
            tokenOffsetInText: number;
            topToken?: string;
            tokenCount: number;
          };

          const tokens: LogProbInfo[] = [];
          let previousTextOffset = -1;
          if (choice.logprobs != null) {
            for (let i = 0; i < choice.logprobs.tokens.length; i++) {
              const token = choice.logprobs.tokens[i];
              const logprob = choice.logprobs.token_logprobs[i];
              const textOffset = choice.logprobs.text_offset[i];
              const topToken = pickTopToken(choice.logprobs.top_logprobs, token, i);
              if (previousTextOffset != textOffset) {
                const logProbInfo: LogProbInfo = {
                  token: token,
                  logProb: logprob,
                  tokenOffsetInText: textOffset,
                  topToken: topToken,
                  tokenCount: 1,
                };
                tokens.push(logProbInfo);
              } else {
                const previous = tokens[tokens.length - 1];

                previous.token =
                  encodeBytes(previous.token) + encodeBytes(token).slice("bytes:".length);
                previous.tokenCount += 1;
                if (previous.topToken && topToken) {
                  previous.topToken =
                    encodeBytes(previous.topToken) + encodeBytes(topToken).slice("bytes:".length);
                }
              }
              previousTextOffset = textOffset;
            }
          }

          tokens.forEach((token) => {
            token.token = SSEToTokens.replaceBytes(SSEToTokens.replaceUnicode(token.token));
            if (token.topToken) {
              token.topToken = SSEToTokens.replaceBytes(SSEToTokens.replaceUnicode(token.topToken));
            }
          });

          if (tokens.length == 0) {
            const tokenCount = promptlib.getTokenizer().tokenLength(choice.text);
            this.workListener.onTokensGenerated(tokenCount);
            const token: Token = {
              completionIndex,
              text: choice.text,
              tokenCount,
            };
            this.push(token);
          } else if (tokens.length == 1) {
            const token: Token = {
              completionIndex,
              text: choice.text,
              ...tokens[0],
            };
            this.workListener.onTokensGenerated(token.tokenCount);
            this.push(token);
          } else if (
            tokens
              .map((t) => t.token)
              .join("")
              .startsWith(choice.text)
          ) {
            // you can have a case (I think caused by RAI filtering) where they
            // truncate the text but not the logprobs/tokens
            // and there's also the case where you get all the text and all the tokens
            let accumulated_text = "";
            let i = 0;
            while (!accumulated_text.startsWith(choice.text)) {
              const token: Token = {
                completionIndex,
                text: tokens[i].token,
                ...tokens[i],
              };
              this.workListener.onTokensGenerated(token.tokenCount);
              this.push(token);
              accumulated_text += tokens[i].token;
              i++;
            }
          } else {
            err = new Error("Unhandled case " + line);
          }
        }
      }
    }
    if (lines.length == 0) {
      this.buf = "";
    } else {
      this.buf = lines[lines.length - 1];
    }
    callback(err, null);
  }

  public static replaceUnicode(s: string): string {
    return s.replace(/\\u([0-9a-fA-F]{4})/g, function (_match, group1) {
      return String.fromCharCode(parseInt(group1, 16));
    });
  }

  public static replaceBytes(s: string): string {
    if (!s.startsWith("bytes:")) {
      return s;
    }
    const bytes: number[] = [];
    let i = "bytes:".length;
    const textEncoder = new TextEncoder();
    while (i < s.length) {
      if (s.slice(i, i + 3) == "\\\\x") {
        bytes.push(parseInt(s.slice(i + 3, i + 5), 16));
        i += 5;
      } else if (s.slice(i, i + 2) == "\\x") {
        bytes.push(parseInt(s.slice(i + 2, i + 4), 16));
        i += 4;
      } else {
        const encoded = textEncoder.encode(s.slice(i, i + 1));
        for (const b of encoded) {
          bytes.push(b);
        }
        i += 1;
      }
    }
    return new TextDecoder("utf8", { fatal: false }).decode(new Uint8Array(bytes));
  }
}

function pickTopToken(top_logprobs: any, token: string, i: number) {
  if (!top_logprobs) {
    return undefined;
  }
  if (!top_logprobs[i]) {
    return token;
  }
  return Object.keys(top_logprobs[i])[0];
}

function encodeBytes(s: string) {
  if (s.startsWith("bytes:")) {
    return s;
  }
  const bytes: number[] = [];
  const textEncoder = new TextEncoder();
  for (const b of textEncoder.encode(s)) {
    bytes.push(b);
  }

  // convert bytes to a string of hex
  let hex = "bytes:";
  for (const b of bytes) {
    hex += "\\x" + b.toString(16).padStart(2, "0");
  }
  return hex;
}
