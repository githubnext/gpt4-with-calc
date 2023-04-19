// In the engine, many operations may hit a work limit or cancellation condition.
//
// These will be surfaced in various ways in the bot or API.

type NonCompletionReason = "work limit reached" | "cancelled" | "error";

export function resultOk<T>(result: T): ResultOk<T> {
  return { completed: true, result: result };
}

export function resultOtherError(message: string): ResultFail {
  console.log("LOG: error: " + message);
  return { completed: false, reason: "error", message };
}

export function resultException(e: Error): ResultFail {
  console.log("LOG: exception: " + e.message);
  return { completed: false, reason: "error", message: e.message };
}

export function workLimitReached(): ResultFail {
  console.log("LOG: work limit reached");
  return {
    completed: false,
    reason: "work limit reached",
    message: "the operation was too large to complete, the maximum model work limit was reached",
  };
}

export function cancelled(): ResultFail {
  console.log("LOG: cancelled");
  return { completed: false, reason: "cancelled", message: "the operation was cancelled" };
}

export function getReasonText(result: {
  completed: false;
  reason: NonCompletionReason;
  message?: string;
}): string {
  return result.message ? result.message : result.reason;
}

export type Result<T> = ResultOk<T> | ResultFail;

export type ResultOk<T> = { completed: true; result: T };
export type ResultFail = { completed: false; reason: NonCompletionReason; message?: string };

export function isResultOk<T>(result: Result<T>): result is ResultOk<T> {
  return result.completed;
}

export function isResultFail<T>(result: Result<T>): result is ResultFail {
  return !result.completed;
}
