# Equipping GPT-4 with Arithmetic

Author: Don Syme, GitHub Next, with input from others at [GitHub Next](https://githubnext.com/). [![image](https://user-images.githubusercontent.com/7204669/233200133-1263d0d1-6be2-494a-abb2-b03b5f1964df.png)](https://githubnext.com/)

[Proof-of-concept implementation](https://github.com/githubnext/gpt4e). Access available on request.

> NOTE: The technique needs rigorous evaluation and refinement and we encourage collaboration. Please iterate with us and take this further. If publishing externally please contact us and include us as co-authors.

Date: 18 April 2023

## The Problem

GPT-4 is catastrophically terrible at arithmetic. It makes egregious, basic mistakes all the time that lead to terrible user experiences on texts involving even the most basic arithmetic problems.

Take for example [this problem with Bing AI](https://dkb.blog/p/bing-ai-cant-be-trusted#%C2%A7gap-financial-statement-summary). To quote from the author:

> This is by far the worst mistake made during the demo. It’s also the most unexpected. I would have thought that summarizing a document would be trivial for AI at this point.

GPT-4 is also terrible at comparative logic involving numbers. It quite happily writes sentences like this (emphasis added):

> Both companies reported an increase in net sales compared to the same quarter last year, but Gap Inc. had a much **larger** absolute **and relative** increase ($4.04 billion, **up 2%**) than lululemon ($1.9 billion, **up 28%**).

Ugh, 2 is not greater than 28. Half right but totally wrong.

In short, GPT-4 can't handle numbers or comparisons of numbers, period. In our opinion, _GPT-4 should not be trusted to write a number that is not present verbatim in the input, nor to reason about numbers in any significant way. In trust scenarios, don't allow GPT-4 to write numbers, and beware that every numeric comparison may be flawed._

## The Hope

There is, however, hope, and it is in this simple logic:

1. GPT-4 is terrible at **arithmetic** but good at **writing arithmetic code**
2. Python and many other tools are perfect at **evaluating arithmetic code**.

The answer is obvious: get GPT-4 to write the arithmetic code, and get Python or some other tool to evaluate it.

## The Approach

Our aim is to “equip” or ["augment"](https://arxiv.org/abs/2302.07842) GPT-4 with an arithmetic calculator. The approach is simple:

Without arithmetic equipping:

1. **GPT-4**: Question ➡️ Answer

With arithmetic equipping:

1. **GPT-4**: Question ➡️ Arithmetic code
2. **Arithmetic Evaluator**: Arithmetic code ➡️ Arithmetic answers
3. **GPT-4**: Question + Arithmetic code + Arithmetic answers ➡️ Answer

We call this "equipping" GPT-4 with arithmetic. GPT-4 has a new tool in the box, and it turns out it loves to use it.

## A sample equipping prompt

In Step 1 we prompt GPT-4 to produce relevant arithmetic code. There are many ways to do this and further experimentation will be needed, but here's an example prompt addition, placed after the question:

```
# Guidance

Do not answer the question. Instead, your task is to write some arithmetic and comparisons relevant to answering the question.

After the question write a code block with up to three sections containing content relevant to answering the question.

In the "Definitions" section define a label for each number in the original question like `car_count` or `speed_of_car_in_km_per_hour`.
* Every label name should include the unit of measure if known.
* This section should be valid Python and can include valid Python single-dimensional arrays.
* Do not use or create multi-dimensional arrays.
* Give each label a unit of measure in a comment after each definition.
* Document the meaning of each definition in the comment.
* If the unit of measure is unknown use "unknown".
* Omit this section if there are no numbers in the question.

In the "Arithmetic" section define additional relevant labels using Python or numpy formulae.
* Define each label using a formula, referencing previously defined labels.
* Avoid new assumptions in this section, if you make an assumption document it.
* Every label name should include the unit of measure if known.
* Do NOT include the calculated values for these labels.
* Give each label a unit of measure in a comment after each definition.
* Document the meaning of each definition in the comment.
* If the unit of measure is unknown use "unknown".
* This section should be valid Python using regular Python or numpy.
* Omit this section if there are no additional labels relevant to the answer.

In the "Comparisons" section define additional labels using Python or numpy formulae by comparing labels using comparison operators and functions and evaluating to single boolean values.
* Do NOT include the calculated true/false values for these labels.
* This section should be valid Python using regular Python or numpy.
* Document the meaning of each definition in the comment.
* Omit this section if there are no comparisons relevant to the answer.

## Relevant arithmetic and comparisons

```

> NOTE: in our manual testing, we generated Python arithmetic code. In our prototype, for convenience we generated Javascript arithmetic code. There are many choices here and it is not strictly necessary to generate a general-purpose programming language. See discussion in Appendix.


GPT-4 then writes the arithmetic code and stops.

Step 2 evaluates his arithmetic code.

Step 3 combines the original question with both the arithmetic code and answers and generates the answer to the question. (The arithmetic code is included as it contains relevant explanation text - this could be omitted if the explanation text is combined with the answers). 

## Example 1

Take this problem:

```
This is an extract from the Microsoft annual report for 2022:

Microsoft repurchased the following shares of common stock under the share repurchase programs:
(In millions)	Shares		Amount		Shares		Amount		Shares		Amount
Year Ended June 30,			2022				2021				2020
First Quarter	21		$6,200		25		$5,270		29		$4,000
Second Quarter	20		6,233		27		5,750		32		4,600
Third Quarter	26		7,800		25		5,750		37		6,000
Fourth Quarter	28		7,800		24		6,200		28		5,088

What is the overall average and standard deviation of shares repurchased per quarter over these three years in dollars?
```

The correct numeric answers are:

```
>>> avg
5890.916666666667
>>> std
1077.0771759978743
```

### Old Approach

A sample plain textual response from GPT-4 is unsurprisingly garbage - GPT-4 can't do numbers.

> ...lots of working ...
>
> Therefore, the overall average and standard deviation of shares repurchased per quarter over these three years in dollars are 17,898.25 million dollars and 1,583.68 million dollars, respectively.

Nope GPT-4, wrong.

### New Approach, Step 1

Now take a multi-phase approach. In step 1 we add the prompt from the previous section, and generate the arithmetic:

```python
# Definitions
shares_2022 = [21, 20, 26, 28] # millions of shares
amount_2022 = [6200, 6233, 7800, 7800] # millions of dollars
shares_2021 = [25, 27, 25, 24] # millions of shares
amount_2021 = [5270, 5750, 5750, 6200] # millions of dollars
shares_2020 = [29, 32, 37, 28] # millions of shares
amount_2020 = [4000, 4600, 6000, 5088] # millions of dollars

# Arithmetic
total_shares = shares_2022 + shares_2021 + shares_2020 # millions of shares
total_amount = amount_2022 + amount_2021 + amount_2020 # millions of dollars
average_amount = np.mean(total_amount) # millions of dollars
std_amount = np.std(total_amount) # millions of dollars

# Comparisons
more_shares_2022 = shares_2022 > shares_2021 # boolean array
more_amount_2022 = amount_2022 > amount_2021 # boolean array
highest_amount = np.max(total_amount) # millions of dollars
lowest_amount = np.min(total_amount) # millions of dollars
highest_amount_quarter = total_amount.index(highest_amount) + 1 # quarter number
lowest_amount_quarter = total_amount.index(lowest_amount) + 1 # quarter number
```

### New Approach, Step 2

We evaluate the arithmetic using Python by adding `import numpy as np`, evaluating and printing:

```
shares_2022 [21, 20, 26, 28]
amount_2022 [6200, 6233, 7800, 7800]
shares_2021 [25, 27, 25, 24]
amount_2021 [5270, 5750, 5750, 6200]
shares_2020 [29, 32, 37, 28]
amount_2020 [4000, 4600, 6000, 5088]
total_shares [21, 20, 26, 28, 25, 27, 25, 24, 29, 32, 37, 28]
total_amount [6200, 6233, 7800, 7800, 5270, 5750, 5750, 6200, 4000, 4600, 6000, 5088]
more_shares_2022 False
more_amount_2022 True
average_amount 5890.916666666667
std_amount 1077.077175997874
highest_amount 7800
lowest_amount 4000
highest_amount_quarter 3
lowest_amount_quarter 9
```

### New Approach, Step 3

We now take the result text and add both the arithmetic and its solutions to the original problem:

````md
# Question

... <as above> ...

## Relevant arithmetic and comparisons

```python
shares_2022 = [21, 20, 26, 28] # millions of shares
... <as above> ...
```

## Evaluation of relevant arithmetic and comparisons

```
more_shares_2022 False
... <as above> ...
```

# Answer
````

The GPT-4 generated answer is now correct:

```md
The overall average and standard deviation of shares repurchased per quarter over these three years in dollars are:

- Average: $5,890.92 million
- Standard deviation: $1,077.08 million
```

## Example 2

Take this harder example:

```
This is an extract from the Microsoft annual report for 2022:

Microsoft repurchased the following shares of common stock under the share repurchase programs:

(In millions)	Shares		Amount		Shares		Amount		Shares		Amount
Year Ended June 30,			2022				2021				2020
First Quarter	21		$6,200		25		$5,270		29		$4,000
Second Quarter	20		6,233		27		5,750		32		4,600
Third Quarter	26		7,800		25		5,750		37		6,000
Fourth Quarter	28		7,800		24		6,200		28		5,088

This is an extract from the Google annual report for 2022:

Share Repurchases
In April 2022, the Board of Directors of Alphabet authorized the company to repurchase up to $70.0 billion of its
Class A and Class C shares. As of December 31, 2022, $28.1 billion remains available for Class A and Class C share
repurchases.
The following table presents Class A and Class C shares repurchased and subsequently retired (in millions):
Year Ended December 31, 2021 Year Ended December 31, 2022
Shares Amount Shares Amount
Class A share repurchases 24 $ 3,399 61 $ 6,719
Class C share repurchases 383 46,875 469 52,577
Total share repurchases 407 $ 50,274 530 $ 59,296
Class A and Class C shares are repurchased in a manner deemed in the best interest of the company and its
stockholders, taking into account the economic cost and prevailing market conditions, including the relative trading
prices and volumes of the Class A and Class C shares. Repurchases are executed from time to time, subject to
general business and market conditions and other investment opportunities, through open market purchases or
privately negotiated transactions, including through Rule 10b5-1 plans. The repurchase program does not have an
expiration date.

Which company repurchased more a greater amount of shares, in total value, in 2021 and 2022 combined. What are the respective total amounts for the two companies?
```

Here is the extracted arithmetic program:

```python
# Definitions
# Microsoft share repurchase amounts by quarter and year in millions of dollars
ms_q1_2021 = 5270 # million dollars
ms_q2_2021 = 5750 # million dollars
ms_q3_2021 = 5750 # million dollars
ms_q4_2021 = 6200 # million dollars
ms_q1_2022 = 6200 # million dollars
ms_q2_2022 = 6233 # million dollars
ms_q3_2022 = 7800 # million dollars
ms_q4_2022 = 7800 # million dollars

# Google share repurchase amounts by year and class in millions of dollars
goog_a_2021 = 3399 # million dollars
goog_c_2021 = 46875 # million dollars
goog_a_2022 = 6719 # million dollars
goog_c_2022 = 52577 # million dollars

# Arithmetic
# Microsoft total share repurchase amount by year in millions of dollars
ms_2021 = ms_q1_2021 + ms_q2_2021 + ms_q3_2021 + ms_q4_2021 # million dollars
ms_2022 = ms_q1_2022 + ms_q2_2022 + ms_q3_2022 + ms_q4_2022 # million dollars

# Google total share repurchase amount by year in millions of dollars
goog_2021 = goog_a_2021 + goog_c_2021 # million dollars
goog_2022 = goog_a_2022 + goog_c_2022 # million dollars

# Microsoft and Google total share repurchase amount in 2021 and 2022 combined in millions of dollars
ms_total = ms_2021 + ms_2022 # million dollars
goog_total = goog_2021 + goog_2022 # million dollars

# Comparisons
# Which company repurchased more a greater amount of shares, in total value, in 2021 and 2022 combined
goog_more_than_ms = goog_total > ms_total # boolean
ms_more_than_goog = ms_total > goog_total # boolean
```

Executing this gives:

```
ms_2021 22970
ms_2022 28033
goog_2021 50274
goog_2022 59296
ms_total 51003
goog_total 109570
goog_more_than_ms True
ms_more_than_goog False
```

And now GPT-4 produces the correct answer:

```
Google repurchased more a greater amount of shares, in total value, in 2021 and 2022 combined. The respective total amounts for the two companies are:

- Google: $109.57 billion
- Microsoft: $51.003 billion
```

Without this technique, GPT-4 sometimes gets the answer wrong, e.g. one sample gave:

```
Microsoft repurchased more a greater amount of shares, in total value, in 2021 and 2022 combined. The respective total amounts for the two companies are:

- Microsoft: $6,200 + $6,233 + $7,800 + $7,800 + $5,270 + $5,750 + $5,750 + $6,200 + $4,000 + $4,600 + $6,000 + $5,088 = $70,691 million
- Google: $50,274 + $59,296 = $109,570 million
```

## Example 3

Here is a classic Chat-GPT fail:

> What is the number of years it takes for an item growing at 30% annually to double?

A typical failing response:

```
One way to approach this question is to use the formula for compound interest, which is:

A = P(1 + r)^n

where A is the final amount, P is the initial amount, r is the annual interest rate (as a decimal), and n is the number of years.

We want to find n such that A = 2P, meaning the item has doubled in value. Substituting these values into the formula, we get:

2P = P(1 + 0.3)^n

Dividing both sides by P, we get:

2 = (1 + 0.3)^n

Taking the natural logarithm of both sides, we get:

ln(2) = n ln(1 + 0.3)

Solving for n, we get:

n = ln(2) / ln(1 + 0.3)

Using a calculator, we get:

n ≈ 2.53

Therefore, it takes about 2.53 years for an item growing at 30% annually to double.
```

The final answer - 2.53 - is wrong. GPT-4 can do quite a lot of good mathematical explanation and reasoning, but it can't do the final arithmetic step.

Arithmetic equipping to the rescue! Hope is restored! The extracted arithmetic code is:

```python
# Definitions
growth_rate = 0.3 # annual growth rate as a decimal fraction
initial_amount = 1 # initial amount of the item in unknown units
doubling_amount = 2 # amount of the item after doubling in unknown units

# Arithmetic
# Use the formula A = P * (1 + r)^t, where A is the final amount, P is the initial amount, r is the growth rate, and t is the time in years
doubling_time = np.log(doubling_amount / initial_amount) / np.log(1 + growth_rate) # time in years it takes for the item to double
```

The evaluation is:

```
doubling_time 2.6419267958111403
```

and the final written answer is now correct:

> The number of years it takes for an item growing at 30% annually to double is approximately 2.64 years.

Happiness.

## Example 4

We have applied this technique to the very large and complex problem originally quoted - the comparison of two financial reports. [The full text of our version of the problem can be found here](https://gist.github.com/dsyme/f96372f465b8e93d0418ae5c887d065d)

While not perfect, the technique vastly improves the generated text. The generated arithmetic is as follows:

`````
## Relevant arithmetic and comparisons

````python
# Definitions
gap_net_sales = 4.04 # billion USD
gap_comparable_sales = 0.01 # fraction
gap_online_sales = 0.39 # fraction of net sales
gap_store_sales = 0.01 # fraction of net sales
gap_gross_margin = 0.374 # fraction
gap_operating_income = 186 # million USD
gap_operating_margin = 0.046 # fraction
gap_net_income = 282 # million USD
gap_diluted_eps = 0.77 # USD
gap_inventory = 3.04 # billion USD
gap_capital_expenditures = 577 # million USD
gap_dividend = 0.15 # USD per share
gap_share_repurchases = 12 # million USD
gap_store_count = 3380 # number of stores

lulu_net_revenue = 1.9 # billion USD
lulu_comparable_sales = 0.22 # fraction
lulu_ecommerce_revenue = 0.413 # fraction of net revenue
lulu_store_revenue = 0.486 # fraction of net revenue
lulu_gross_profit = 1.0 # billion USD
lulu_gross_margin = 0.559 # fraction
lulu_operating_income = 352.4 # million USD
lulu_operating_margin = 0.19 # fraction
lulu_net_income = 255.5 # million USD
lulu_diluted_eps = 2.00 # USD
lulu_inventory = 1.7 # billion USD
lulu_capital_expenditures = 175.6 # million USD
lulu_share_repurchases = 17 # million USD
lulu_store_count = 623 # number of stores

# Arithmetic
gap_gross_profit = gap_net_sales * gap_gross_margin # billion USD
lulu_net_revenue_growth = (lulu_net_revenue - 1.3) / 1.3 # fraction
lulu_store_revenue_growth = (lulu_store_revenue - 0.488) / 0.488 # fraction
lulu_ecommerce_revenue_growth = (lulu_ecommerce_revenue - 0.404) / 0.404 # fraction
gap_inventory_growth = (gap_inventory - 2.72) / 2.72 # fraction
lulu_inventory_growth = (lulu_inventory - 0.92) / 0.92 # fraction
gap_capital_expenditures_growth = (gap_capital_expenditures - 308) / 308 # fraction
lulu_capital_expenditures_growth = (lulu_capital_expenditures - 122.5) / 122.5 # fraction
gap_dividend_yield = gap_dividend * 4 / gap_diluted_eps # fraction
lulu_dividend_yield = 0 # fraction
gap_share_repurchases_yield = gap_share_repurchases / gap_net_income # fraction
lulu_share_repurchases_yield = lulu_share_repurchases / lulu_net_income # fraction

# Comparisons
gap_net_sales > lulu_net_revenue # true/false
gap_comparable_sales < lulu_comparable_sales # true/false
gap_online_sales < lulu_ecommerce_revenue # true/false
gap_store_sales < lulu_store_revenue # true/false
gap_gross_margin < lulu_gross_margin # true/false
gap_operating_income < lulu_operating_income # true/false
gap_operating_margin < lulu_operating_margin # true/false
gap_net_income > lulu_net_income # true/false
gap_diluted_eps < lulu_diluted_eps # true/false
gap_inventory_growth > lulu_inventory_growth # true/false
gap_capital_expenditures_growth > lulu_capital_expenditures_growth # true/false
gap_dividend_yield > lulu_dividend_yield # true/false
gap_share_repurchases_yield < lulu_share_repurchases_yield # true/false
gap_store_count > lulu_store_count # true/false
`````

This is not bad, but there are new assumed numbers such as `2.72` in the generated arithmetic code that do not relate to anything in the source text. UPDATE: this fabrication can be eliminated through more stringent prompting, see the appendix.

The resulting text is still a huge improvement, as all the comparisons are "the right way around", and each of the numbers is grounded in an arithmetic derivation:

> - Gap Inc. had more than twice the net sales of Lululemon in Q3 2022 ($4.04 billion vs. $1.9 billion), but Lululemon grew its net revenue much faster than Gap Inc. (46% vs. 2% year-over-year).
> - Lululemon had a higher proportion of its net revenue coming from e-commerce than Gap Inc. (41.3% vs. 39%), and also grew its e-commerce revenue faster than Gap Inc. (31% vs. 5% year-over-year).
> - Lululemon had a much higher gross margin than Gap Inc. (55.9% vs. 37.4%), and also a higher operating margin (19% vs. 4.6%). This means that Lululemon was more profitable and efficient than Gap Inc. in generating income from its sales.
> - Gap Inc. had a higher net income than Lululemon in Q3 2022 ($282 million vs. $255.5 million), but this was mainly due to a large income tax benefit of $114 million that Gap Inc. recorded in the quarter. Lululemon had a higher diluted earnings per share than Gap Inc. ($2.00 vs. $0.77), which reflects its higher profitability per share of common stock.
> - Gap Inc. had a much higher capital expenditures growth than Lululemon in Q3 2022 (87.3% vs. 43.3% year-over-year), which means that Gap Inc. invested more in its property and equipment than Lululemon. Gap Inc. also had a higher capital expenditures level relative to its net sales than Lululemon ($577 million vs. $175.6 million).
> - Gap Inc. paid a quarterly dividend of $0.15 per share, which translates to a dividend yield of 0.78% based on its diluted earnings per share. Lululemon did not pay any dividend in Q3 2022. This means that Gap Inc. returned more cash to its shareholders than Lululemon in the form of dividends.
> - Lululemon repurchased more shares than Gap Inc. in Q3 2022 ($17 million vs. $12 million), and also had a higher share repurchases yield than Gap Inc. (6.7% vs. 4.3%), which means that Lululemon returned more cash to its shareholders than Gap Inc. in the form of share buybacks.
> - Gap Inc. had more store locations than Lululemon in Q3 2022 (3,380 vs. 623), but Lululemon opened more net new stores than Gap Inc. in the quarter (23 vs. 1). This means that Lululemon expanded its physical presence more than Gap Inc. in the quarter.

While not perfect it is many, many times better than the original answer.

## Example 5

Take pretty much any basic arithmetic math problem that doesn't invovle really simple numbers, e.g. from [This LA County math exam](https://hr.lacounty.gov/wp-content/uploads/2016/12/Basic-Arithmetic-v1.pdf):

> Fred’s gross salary is \$850 per week. From his salary, 11% is removed for federal deductions; 5.5% for state deductions; and 6.2% for the company’s pension plan. If each of these deductions is taken as a percent of Fred’s gross salary, what is his net salary for a fourweek period?

Without arithmetic equipping the answer is wrong:

> $2448.20

With arithmetic equipping the answer is correct:

> Fred's net salary for a four-week period is $2628.20.

In the Javascript-generating prototype, the generated arithmetic code (with full generated documentation comments) is:

```javascript
// Definitions
let gross_salary_per_week = 850; // in dollars, the amount Fred earns before deductions
let federal_deduction_rate = 0.11; // in fraction, the percentage of gross salary removed for federal taxes
let state_deduction_rate = 0.055; // in fraction, the percentage of gross salary removed for state taxes
let pension_deduction_rate = 0.062; // in fraction, the percentage of gross salary removed for the company's pension plan
let weeks_per_period = 4; // in weeks, the length of the period for which the net salary is calculated

// Arithmetic
let federal_deduction_per_week = gross_salary_per_week * federal_deduction_rate; // in dollars, the amount of federal taxes deducted from the gross salary per week
let state_deduction_per_week = gross_salary_per_week * state_deduction_rate; // in dollars, the amount of state taxes deducted from the gross salary per week
let pension_deduction_per_week = gross_salary_per_week * pension_deduction_rate; // in dollars, the amount of pension contribution deducted from the gross salary per week
let total_deduction_per_week =
  federal_deduction_per_week + state_deduction_per_week + pension_deduction_per_week; // in dollars, the total amount of deductions from the gross salary per week
let net_salary_per_week = gross_salary_per_week - total_deduction_per_week; // in dollars, the amount Fred takes home after deductions per week
let net_salary_per_period = net_salary_per_week * weeks_per_period; // in dollars, the amount Fred takes home after deductions for a four-week period
```

## Alternatives and variations

During this investigation we investigated some alternatives:

- We tried variations using a single model invocation, producing a mix of arithmetic code plus text. Some examples clearly required conditional text, which we started to investigate by making the generated final text be conditional/templated/interpolated. However, the longer longer financial report examples above convinced us that too much reasoning remained in text generation, and that it is a clearer and simpler architecture to use a specific model invocation to enrich with an arithmetic program. Certainly a single invocation is viable for smaller examples.

- We tried variations using a single model invocation that generates only a program, which is encouraged to print the full final text - so the only output was a program which could include arithmetic content. However that seemed to result in output texts more like those programmers write for diagnostics or output - terse, rather than well-written human-facing output text. Again, it seems a clearer and simpler architecture to distinguish between a phase that enriches with arithmetic code, and a phase which uses GPT-4 in text-generation mode.

## Conclusion

GPT-4 can't do arithmetic or comparisons. But it can write pretty good arithmetic code. By using a two-phase approach we can equip GPT-4 with arithmetic by writing the arithmetic code and evaluating it with Python or a similar interpreter.

This has truly huge advantages:

1. Applications based on GPT-4 become much more reliable at arithmetic.
2. A major cause of reputation loss is greatly reduced.
3. The derivation of all numbers in the output can be explained through the presentation of the arithmetic code that derived it.
4. Alternative output formats such as spreadsheets, executable notebooks or outright code can be produced to back the response.
5. The arithmetic code can be automatically assessed and filtered for certain properties.

Further:

1. We speculate that with further prompting properties such as units (e.g. dollars) and multiplicative constants (e.g. millions) can be really carefully tracked and assessed. Unit mistakes are pernicious and the automated extraction of unit derivations can help here.
2. We speculate that there are many other classes of "equips" that can be dealt with this way. For example, we believe GPT-4 can be "equipped" with Datalog, or an SMT-solver, or Wolfram, or further programmatic data retrieval, or SQL queries.
3. There are a wide variety of "equip" architectures. Early versions of this work used a two step approach, where arithmetic and templated answer were written in one model invocation. Other architectures could ask which equips are most relevant, or iterate on equips until no more information can be incorporated. There are many tradeoffs and much to explore.

The technique needs rigorous evaluation and refinement and we encourage collaboration. Please iterate with us and take this further. If publishing externally please include us as co-authors.

## Related Work

There's a recent survey paper on techniques to augment Language Models, see https://arxiv.org/abs/2302.07842. Most the papers used retraining or fine tuning specifically to use such tools, but the survey is comprehensive and a useful guide to equips (augmentations).

## Appendix: Update on Example 4

Adding the following lines in the prompt eliminated the addition of hallucinated assumptions in the arithmetic code:

     Avoid new assumptions in this section, if you make an assumption document it.
     Document the meaning of each definition in the comment.

In the latest implemented proof-of-concept (generating Javascript for the arithmetic code), the generated arithmetic became:

```javascript
// Definitions
let gap_net_sales = 4.04; // billion USD, total net sales for Gap Inc. in Q3 2022
let gap_comparable_sales = 0.01; // decimal, year-over-year growth rate of comparable sales for Gap Inc. in Q3 2022
let gap_gross_margin = 0.374; // decimal, reported gross margin as a percentage of net sales for Gap Inc. in Q3 2022
let gap_operating_margin = 0.046; // decimal, reported operating margin as a percentage of net sales for Gap Inc. in Q3 2022
let gap_diluted_eps = 0.77; // USD, reported diluted earnings per share for Gap Inc. in Q3 2022
let gap_inventory = 3.04; // billion USD, ending inventory for Gap Inc. in Q3 2022
let gap_capital_expenditures = 0.577; // billion USD, year-to-date capital expenditures for Gap Inc. in Q3 2022

let lululemon_net_sales = 1.9; // billion USD, total net revenue for lululemon in Q3 2022
let lululemon_comparable_sales = 0.22; // decimal, year-over-year growth rate of total comparable sales for lululemon in Q3 2022
let lululemon_gross_margin = 0.559; // decimal, gross margin as a percentage of net revenue for lululemon in Q3 2022
let lululemon_operating_margin = 0.19; // decimal, operating margin as a percentage of net revenue for lululemon in Q3 2022
let lululemon_diluted_eps = 2.0; // USD, diluted earnings per share for lululemon in Q3 2022
let lululemon_inventory = 1.7; // billion USD, ending inventory for lululemon in Q3 2022
let lululemon_capital_expenditures = 0.176; // billion USD, capital expenditures for lululemon in Q3 2022

// Arithmetic
let net_sales_difference = lululemon_net_sales - gap_net_sales; // billion USD, difference in net sales between lululemon and Gap Inc. in Q3 2022
let net_sales_ratio = lululemon_net_sales / gap_net_sales; // decimal, ratio of net sales between lululemon and Gap Inc. in Q3 2022
let comparable_sales_difference = lululemon_comparable_sales - gap_comparable_sales; // decimal, difference in comparable sales growth rate between lululemon and Gap Inc. in Q3 2022
let comparable_sales_ratio = lululemon_comparable_sales / gap_comparable_sales; // decimal, ratio of comparable sales growth rate between lululemon and Gap Inc. in Q3 2022
let gross_margin_difference = lululemon_gross_margin - gap_gross_margin; // decimal, difference in gross margin percentage between lululemon and Gap Inc. in Q3 2022
let gross_margin_ratio = lululemon_gross_margin / gap_gross_margin; // decimal, ratio of gross margin percentage between lululemon and Gap Inc. in Q3 2022
let operating_margin_difference = lululemon_operating_margin - gap_operating_margin; // decimal, difference in operating margin percentage between lululemon and Gap Inc. in Q3 2022
let operating_margin_ratio = lululemon_operating_margin / gap_operating_margin; // decimal, ratio of operating margin percentage between lululemon and Gap Inc. in Q3 2022
let diluted_eps_difference = lululemon_diluted_eps - gap_diluted_eps; // USD, difference in diluted earnings per share between lululemon and Gap Inc. in Q3 2022
let diluted_eps_ratio = lululemon_diluted_eps / gap_diluted_eps; // decimal, ratio of diluted earnings per share between lululemon and Gap Inc. in Q3 2022
let inventory_difference = lululemon_inventory - gap_inventory; // billion USD, difference in ending inventory between lululemon and Gap Inc. in Q3 2022
let inventory_ratio = lululemon_inventory / gap_inventory; // decimal, ratio of ending inventory between lululemon and Gap Inc. in Q3 2022
let capital_expenditures_difference = lululemon_capital_expenditures - gap_capital_expenditures; // billion USD, difference in capital expenditures between lululemon and Gap Inc. in Q3 2022
let capital_expenditures_ratio = lululemon_capital_expenditures / gap_capital_expenditures; // decimal, ratio of capital expenditures between lululemon and Gap Inc. in Q3 2022

// Comparisons
let net_sales_higher = lululemon_net_sales > gap_net_sales; // boolean, true if lululemon had higher net sales than Gap Inc. in Q3 2022, false otherwise
let comparable_sales_higher = lululemon_comparable_sales > gap_comparable_sales; // boolean, true if lululemon had higher comparable sales growth rate than Gap Inc. in Q3 2022, false otherwise
let gross_margin_higher = lululemon_gross_margin > gap_gross_margin; // boolean, true if lululemon had higher gross margin percentage than Gap Inc. in Q3 2022, false otherwise
let operating_margin_higher = lululemon_operating_margin > gap_operating_margin; // boolean, true if lululemon had higher operating margin percentage than Gap Inc. in Q3 2022, false otherwise
let diluted_eps_higher = lululemon_diluted_eps > gap_diluted_eps; // boolean, true if lululemon had higher diluted earnings per share than Gap Inc. in Q3 2022, false otherwise
let inventory_higher = lululemon_inventory > gap_inventory; // boolean, true if lululemon had higher ending inventory than Gap Inc. in Q3 2022, false otherwise
let capital_expenditures_higher = lululemon_capital_expenditures > gap_capital_expenditures; // boolean, true if lululemon had higher capital expenditures than Gap Inc. in Q3 2022, false otherwise
```

However the risk that code-generation will encode new hallucinations is real. Some techniques to deal with this are

- Heavy prompting to avoid new assumptions, as above
- Filtering or rejection of arithmetic code that doesn't conform to expected requriements
- Size restrictions rejecting new hallucinated arithmetic code when inputs are small

For end user-experience it may also be very important to have the models include a textual explanation of any arithmetic assumptions made in generating the text. This is feasible given the above through another model invocation to explain any assumptins made.

### Appendix: What format for arithmetic code?

We have left open what format should be used for arithmetic code. For convenience we have shown generating Python and Javascript. However introducing arbitrary code generation and execution in general-purpose languages is not necessary for this technique - instead the prompts should continue to be devloped to demand the generation of highly restricted calculation code. A limited subset of Python+numpy or Javascript or similar could still be used but a processing step should be added to strictly check the conformance of the arithmetic code to a well-defined known subset. Careful sandboxing of the execution (or careful interpretation) will also be required.
