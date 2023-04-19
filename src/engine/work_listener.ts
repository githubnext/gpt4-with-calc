export class WorkListener {
  tokensGenerated = 0;
  tokensAnalyzed = 0;
  completionRequests = 0;

  onTokensGenerated(numberOfTokens: number) {
    this.tokensGenerated += numberOfTokens;
  }

  onTokensAnalyzed(numberOfTokens: number) {
    this.tokensAnalyzed += numberOfTokens;
  }

  onCompletionRequest() {
    this.completionRequests++;
  }

  public toRecord(): { [name: string]: number } {
    const result: { [name: string]: number } = {};
    for (const [key, value] of Object.entries(this)) {
      if (!key.startsWith("_")) {
        result[key] = value;
      }
    }
    return result;
  }

  public toString(): string {
    return JSON.stringify(this.toRecord(), null, 2);
  }
}
