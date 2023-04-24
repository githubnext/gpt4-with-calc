import { Problem } from "./calc";

// Convert 92 miles per hour to meters per second.
// Convert 2021 pounds to kilograms.
// Convert 1000 millimeters to meters.
// Convert 5000 joules to calories.
// Convert 1000 pascals to atmospheres.
// Convert 1000 meters to kilometers.
// Convert 1000 grams to kilograms.
// Convert 1000 milliliters to liters.
// Convert 1313 newtons per square meter to pounds per square inch.
// Convert 1000 watts to horsepower.

function unitConversionCalc(): Problem[] {
  return [
    {
      id: `units-0001`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 92 miles per hour to meters per second. Answer using nearest whole number.`,
      expected: "41",
    },
    {
      id: `units-0002`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 92 miles per hour to meters per second. Answer to one decimal place.`,
      expected: "41.1",
    },
    {
      id: `units-0003`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 92 miles per hour to meters per second. Answer to two decimal places.`,
      expected: "41.13",
    },
    {
      id: `units-0004`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 1004 millimeters to meters.`,
      expected: "1.004 (meters)",
    },
    {
      id: `units-0005`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 1313 newtons per square meter to pounds per square inch. Answer to two decimal places.`,
      expected: "0.19",
    },
    {
      id: `units-0006`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 1313000 newtons per square meter to pounds per square inch. Answer to two decimal places.`,
      expected: "190.43",
    },
    {
      id: `units-0007`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 7482 joules to calories. Answer to nearest calorie.`,
      expected: "1788",
    },
    {
      id: `units-0008`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 7482 joules to calories. Answer to one decimal places.`,
      expected: "1788.2",
    },
    {
      id: `units-0009`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 7482 joules to calories. Answer to two decimal places.`,
      expected: "1788.24",
    },
    {
      id: `units-0010`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 85.6C to Farenheit. Answer to two decimal places.`,
      expected: "186.08",
    },
    {
      id: `units-0011`,
      grade: `8`,
      kind: `unit conversions`,
      question: `Convert 85.63C to Farenheit. Answer to three decimal places.`,
      expected: "186.134",
    },
  ];
}

export function getProblems() {
  return [...unitConversionCalc()];
}
