export type Range = {
  startLine: number;
  endLineInclusive: number;
};

export function shiftRange(range: Range, shift: number): Range {
  return {
    startLine: range.startLine + shift,
    endLineInclusive: range.endLineInclusive + shift,
  };
}
