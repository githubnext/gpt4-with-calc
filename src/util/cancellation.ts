export interface CancellationEvent {
  (listener: () => any): Unregister;
}

export type Unregister = () => void;

// Taken from https://github.com/github/copilot/blob/9043e834de1a1914ed8f2f11fba94a0a61088b70/lib/src/common/cancellation.ts
export interface ICancellationToken {
  /**
   * A flag signalling is cancellation has been requested.
   */
  readonly isCancellationRequested: boolean;

  /**
   * An event which fires when cancellation is requested. This event
   * only ever fires `once` as cancellation can only happen once. Listeners
   * that are registered after cancellation will be called (next event loop run),
   * but also only once.
   */
  readonly onCancellationRequested: CancellationEvent;
}

export class NeverCancelledToken implements ICancellationToken {
  get isCancellationRequested(): boolean {
    return false;
  }

  public onCancellationRequested(_listener: () => any): Unregister {
    return () => {
      return;
    };
  }
}

// Taken from https://github.com/github/copilot/blob/28e553e0c426df7e4d943bebbf02bf77f560e670/agent/src/cancellation.ts
export class MutableToken implements ICancellationToken {
  private _isCancelled = false;
  private handlers: (() => any)[] = [];

  public cancel() {
    if (!this._isCancelled) {
      this._isCancelled = true;
      this.handlers.filter((handler) => handler !== undefined).forEach((handler) => handler());
    }
  }

  get isCancellationRequested(): boolean {
    return this._isCancelled;
  }

  public onCancellationRequested(listener: () => any): Unregister {
    if (this._isCancelled) {
      listener();
    }
    this.handlers.push(listener);

    return () => {
      const index = this.handlers.indexOf(listener);
      if (index != -1) {
        delete this.handlers[index];
      }
    };
  }

  public dispose(): void {
    this.handlers = [];
  }
}
