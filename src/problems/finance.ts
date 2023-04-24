import { Problem } from "./calc";
function mortgageCalc(): Problem[] {
  return [
    {
      id: `fin-0001`,
      grade: `8`,
      kind: `financial`,
      question: `A mortgage of £200,000 is taken out over 30 years at an interest rate of 3% with monthly repayments. What is the monthly repayment rounded to the nearest £100?`,
      expected: "800 (pounds)",
    },
    {
      id: `fin-0002`,
      grade: `8`,
      kind: `financial`,
      question: `A mortgage of £300,000 is taken out over 15 years at an interest rate of 4.5% with monthly repayments. What is the monthly repayment rounded to the nearest £100?`,
      expected: "2300",
    },
    {
      id: `fin-0003`,
      grade: `8`,
      kind: `financial`,
      question: `A mortgage of £300,000 is taken out over 15 years at an interest rate of 4.5% with monthly repayments. What is the total amount paid back to the nearest £1000?`,
      expected: "413000",
    },
    {
      id: `fin-0004`,
      grade: `8`,
      kind: `financial`,
      question: `A mortgage of £300,000 is taken out over 15 years at an interest rate of 4.5% with monthly repayments. Of the total amount paid back, what proportion is interest? Give answer as a whole number percentage e.g. "76%" without quotes.`,
      expected: "27",
    },
    {
      id: `fin-0005`,
      grade: `8`,
      kind: `financial`,
      question: `A mortgage of £300,000 is taken out over 15 years at an interest rate of 4.5% with monthly repayments. Of the total amount paid back, what proportion is principal? Give answer as a whole number percentage e.g. "76%" without quotes.`,
      expected: "73",
    },
    {
      id: `fin-0006`,
      grade: `8`,
      kind: `financial`,
      question: `A mortgage of £300,000 is taken out over 15 years at an interest rate of 4.5% with monthly repayments. What is the ending balance remaining on the mortgage after 10 years to the nearest £1000?`,
      expected: "123000",
    },
    {
      id: `fin-0007`,
      grade: `8`,
      kind: `financial`,
      question: `A mortgage of £300,000 is taken out over 15 years at an interest rate of 4.5% with monthly repayments. Of the first 12 repayments, how much in total goes to paying interest (rather than principal), to the nearest £100?`,
      expected: "13200",
    },
    {
      id: `fin-0008`,
      grade: `8`,
      kind: `financial`,
      question: `A mortgage of £300,000 is taken out over 15 years at an interest rate of 4.5% with monthly repayments. What is the total amount paid back to the nearest £100?`,
      expected: "413100",
    },
    {
      id: `fin-0009`,
      grade: `8`,
      kind: `financial`,
      question: `A mortgage of £300,000 is taken out over 15 years at an interest rate of 4.5% with monthly repayments. What is the total amount paid back to the nearest £10?`,
      expected: "413100",
    },
  ];
}
function rateOfReturnCalc(): Problem[] {
  return [
    {
      id: `fin-rate-0001`,
      grade: `8`,
      kind: `financial`,
      question: `Suppose you buy 100 shares of XYZ stock for $50 per share. One year later, you sell all 100 shares for $60 per share. During the year, you also received $200 in dividends from the stock. What is the rate of return on this stock, as a percentage?`,
      expected: "24 (percent)",
    },
    {
      id: `fin-rate-0002`,
      grade: `8`,
      kind: `financial`,
      question: `Suppose you buy 121 shares of XYZ stock for $53 per share. One year later, you sell all shares for $68.4 per share. During the year, you also received $200 in dividends from the stock. What is the rate of return on this stock? Round to nearest percent.`,
      expected: "32 (percent)",
    },
    {
      id: `fin-rate-0003`,
      grade: `8`,
      kind: `financial`,
      question: `Suppose you buy 121 shares of XYZ stock for $53 per share. One year later, you sell all shares for $68.4 per share. During the year, you also received $200 in dividends from the stock. What is the rate of return on this stock as a percentage, rounded to one decimal place?`,
      expected: "32.2 (percent)",
    },
    {
      id: `fin-rate-0004`,
      grade: `8`,
      kind: `financial`,
      question: `Suppose a firm has Cost of equity 8.5%, Equity $1,983,800, Cost of debt 4.2% and Debt $100,422 and corporate tax rate of 30%. What is the firm's WACC? Give answer as a percentage to one decimal place.`,
      expected: "8.2 (percent)",
    },
    {
      id: `fin-rate-0005`,
      grade: `8`,
      kind: `financial`,
      question: `Suppose a firm has Cost of equity 4.2%, Equity $1934143, Cost of debt 4.2% and Debt $50,042 and corporate tax rate of 22%. What is the firm's WACC? Give answer as a percentage to one decimal place.`,
      expected: "4.2 (percent)",
    },
  ];
}

export function getProblems() {
  return [...mortgageCalc(), ...rateOfReturnCalc()];
}
