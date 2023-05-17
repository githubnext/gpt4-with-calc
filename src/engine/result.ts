// In the engine, many operations may hit an error condition.
//
type NonCompletionReason = "cancelled" | "error";

export function resultOk<T>(result: T): ResultOk<T> {
  return { completed: true, result: result };
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
