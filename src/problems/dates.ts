import { Problem } from "./calc";

// If today is Monday, what day will it be in 100 days?
// If today is January 1st, what day will it be in 365 days?
// If today is January 1st, what day will it be in 730 days?
// If today is January 1st, what day was it 100 days ago?
// If today is January 1st, what day was it 365 days ago?
// If today is January 1st, what day was it 730 days ago?
// How many days are there between January 1st and December 31st of the same year?
// How many days are there between January 1st of one year and December 31st of the next year?
// How many weeks are there between January 1st and December 31st of the same year?
// How many weeks are there between January 1st of one year and December 31st of the next year?

function dayOfWeekCalc(): Problem[] {
  return [
    {
      id: `date-0001`,
      grade: `8`,
      kind: `date`,
      question: `If today is Monday, what day will it be in 100 days?`,
      expected: "Wednesday",
    },
    {
      id: `date-0002`,
      grade: `8`,
      kind: `date`,
      question: `If today is January 1st 2021, what is the date in 365 days?`,
      expected: "January 1st 2022",
    },
    {
      id: `date-0003`,
      grade: `8`,
      kind: `date`,
      question: `If today is April 25th 2023, what is the date in 1 week?`,
      expected: "May 2nd 2023",
    },
    {
      id: `date-0004`,
      grade: `8`,
      kind: `date`,
      question: `If today is April 25th 2023, what is the date in 2 weeks and 2 days?`,
      expected: "May 11th 2023",
    },
    {
      id: `date-0005`,
      grade: `8`,
      kind: `date`,
      question: `How many days are there between April 25th and May 11th, inclusive?`,
      expected: "17",
    },
    {
      id: `date-0006`,
      grade: `8`,
      kind: `date`,
      question: `How many days are there between April 25th and May 11th, excluding the last day?`,
      expected: "16",
    },
    {
      id: `date-0007`,
      grade: `8`,
      kind: `date`,
      question: `If today is April 25th, what day was 30 days ago?`,
      expected: "March 26th",
    },
    {
      id: `date-0008`,
      grade: `8`,
      kind: `date`,
      question: `If today is February 27th 2004, what is the date in 2 weeks and 2 days?`,
      expected: "March 14th 2004",
    },
    {
      id: `date-0009`,
      grade: `8`,
      kind: `date`,
      question: `A payment is made every Tuesday. How many payments are made between 3rd April 2023 and 26th April 2023?`,
      expected: "4",
    },
    {
      id: `date-0010`,
      grade: `8`,
      kind: `date`,
      question: `A payment is made every Tuesday. How many payments are made between 5th April 2023 and 28th April 2023?`,
      expected: "3",
    },
  ];
}

export function getProblems() {
  return [...dayOfWeekCalc()];
}
