# Evaluating "GPT4 Equipped with Arithmetic"

See [the technique](report.md) for an overview of the technique.

> Caveat!!! this work is about calculation, not math. Much of the work on math and GPT-4 attempts to improve its more advanced mathematical capabilities, e.g. for algebra, geometry, problem solving, is mostly based on word problems, and the typical evaluation problem sets are oriented in this way. This is understandable for LLM-based research - why would be use an LLM to try to add "16.84812 + 19.29039" let alone to evaluate trigonometric functions? However in real-life chat people will try to do exactly these kinds of problems: there is a strong user expectation that they can throw in any calculation and the chat will get it right, or else refuse to answer.

> NOTE: Evaluation is currently being done using Javascript codegen. We may look into Python codegen and other options.

### TLDR

Raw calculation (decimals, integers, math functions):

- without equip: **50% mistake rate**, many extreme mistakes
- with equip: **2% mistake rate**, only minor mistakes, see below

Mathematical word puzzles with small integers:

- without equip: **11% mistake rate**
- with equip: **7% mistake rate**

### Raw Calculation

We created a set of 153 decimal and integer calculation problems like this:

> What is the result of adding -942.12 and 1441.23? Give answer rounded to two decimal places.
>
> What is the result of multiplying -942.12 by 1441.23? Give answer rounded to two decimal places.
> ...
> What is the natural logarithm of 1441.23? Give answer rounded to two decimal places.
>
> Is 0.45 plus 0.67 less than or equal to 1 minus (1/3)? Answer "true" or "false" without quotes.
>
> Is 100 divided by 5 less than or equal to 20? Answer "true" or "false" without quotes.

With categories:

- decimal calculation (1, 2, 3, 4 decimal places)
- decimal comparison
- integer comparison

The results are:

- without equip: 76/153 (50% failure rate, many extreme mistakes)
- with equip: 150/153 (2% mistake rate, only minor mistakes, see below)

The remaining minor mistakes were errors in the last decimal place:

```
expected: "24.533", actual: "24.532", question: What is e raised to power 3.2.  Give answer rounded to three decimal places.
expected: "7.3891", actual: "7.3890", question: What is the result of calculating e raised to the power of 2?  Give answer rounded to four decimal places.
expected: "7.2733", actual: "7.2732", question: What is the natural logarithm of 1441.23?  Give answer rounded to four decimal places.
```

These stemmed from two cases of incorrect textual rounding of a correctly calculated result in the final GPT-4 question-answering phase, and a case where the calculated code used a hardwired approximation to `e`:

```
const e = 2.71828; // base of natural logarithm [unknown]
```

We believe these cases can all be easily handled by prompt refinements (e.g. move rounding computations into the calculated code, and always using precise values of constants like `e` and `pi`).

### Mathematical word puzzles

This is a problem set of 2300 childrens maths puzzles, up to grade 6 US curriculum. The puzzles are primarily word problem solving, not calculation.

> NOTE: essentially every problem in this data set can be made to fail with raw GPT-4 simply by making the numbers involved sufficeintly large or adding decimal places. The existing GPT-4 pass rates for this problem set are somewhat deceptive as they assume child-like numbers are involved in real-world problems.

We ran the strategy described here on a modified version of this data set where:

- some additional instructions were added to the questions specifying exact intended output formats
- some answers were corrected (the data set contained mistakes)
- some questions were clarified (they were highly ambiguous and open to interpretation, or assuming prior questions in the data set had been asked).
- the text of some questions triggered Responsible AI filters and was modified in otherwise harmless ways.

These adjustments applied to both GPT-4 and GPT-4e.

When run with the technique here, the error rate reduces from 11% to 7%:

```
Without numeric calculation equip: 254/2303 failures
With numeric calculation equip:    161/2303 failures
```

The mistake rates in the different grades of problems are affected as follows:

```
grade 1: 2 --> 2       // mistakes out of 194
grade 2: 7 --> 2       // mistakes out of 340
grade 3: 25 --> 18     // mistakes out of 808
grade 4: 48 --> 18     // mistakes out of 301
grade 5: 33 --> 16     // mistakes out of 146
grade 6: 137 --> 105   // mistakes out of 514
```

The differrent kinds of problems are interesting and important.

Improved:

```
Subtraction: 28 --> 4
Sum: 10 --> 2
Multiplication: 8 --> 3
Floor-Division: 6 --> 3
Common-Division: 13 --> 8
Comparison: 21 --> 4
TVQ-Final: 3 --> 0
Surplus: 23 --> 10
Algebra-1: 22 --> 15            // note, largely out of zone, only partially calculational
```

Regressed:

```
LCM: 10 --> 17                  // note, largely out of zone, mostly word puzzle curiosities
GCD: 11 --> 14                  // note, largely out of zone, mostly word puzzle curiosities
Sequential-Operation: 3 --> 8   // note, largely out of zone, only partially calculational, mostly "spot the numeric pattern"
```

About the same:

```
Addition: 17 --> 16            // note, remaining are largely date/time calculations
Ceil-Division: 1 --> 1          // note, largely out of zone, mostly word puzzle curiosities
Ratio: 12 --> 11               // note, ratio reduction involves LCM/GCD which isn't a calculational strength
Algebra-2: 43 --> 36           // note, largely out of zone, only partially calculational
```

Notes:

- The big improvements lie in the calculational heart: subtraction, summation, multiplication, comparison, surplus and some division problems.
- In contrast, some areas such as LCM and GCD have been a little impaired. These problems are largely non-calculational mathematical reasoning and are likely vanishingly rare in real-world chat (except for students doing homework puzzles!). However we should continue to investigate the reasons that performance is impaired on this kind of problem, and what can be done to restrict the technique from attempting to work on this kind of problem.

#### Financial

TBD: Assess exact decimal computation, computation of rates etc.

#### DateTime

TBD: Assess ability to do DateTime calculation.

#### Calculations over Data Tables

Word problems: Sum, average, compare, sumprod, .. (TBD)

#### Excel Calculations

TBD: Use Excel-named functions in formulae over tables. Also ask for `sum(data)` etc.

#### Currency Calculations

TBD: Convert between currencies

#### Unit Calculations

TBD: Convert between units `10 km/h converted to m/s` etc. Full SI units, some other adhoc units.

### Assessing variations of calculation code

Taking the mathematical word puzzles, we tried variations on the prompt that eliminated some characteristics of the generated calculations. This really gives a measure of the proportion of word puzzles sensitive to this aspect of calculation.

```
Without numeric calculation equip: 254 failures
With numeric calculation equip:    167 failures
With numeric calculation equip:    161 failures (emitChecks)
```
