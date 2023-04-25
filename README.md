# GPT-4 Equipped

GPT-4 is terrible at calculation with numbers. We look at a technique to fix that.

[**Read the report - GPT-4 Equipped with Calculation**](docs/report.md)

[**Read the evaluation notes**](docs/eval.md)

## The Code

[**GPT-4 Equipped with Calculation**](src/jobs/ask.ts)

The rest is stripped-down boilerplate taken from the CoPilot for PRS repo.

## Build

```sh
sudo apt-get install npm
npm install
npm run build
```

> Note: **you must use a Node version earlier than v18.1** because of an [issue with tree-sitter](https://github.com/github/copilot/issues/1982). It's not actually used in this project yet but likely will be in future iterations.

## Examples

Define a key:

```bash
export NEXT_MODEL2_API_KEY=...
```

Run the examples:

```bash
./gpt4e ask --questionfile test/samples/msft-report-snippet.txt
./gpt4e ask --questionfile test/samples/msft-report-snippet.txt --arith

./gpt4e ask --questionfile test/samples/msft-goog-report-snippets-compared.txt
./gpt4e ask --questionfile test/samples/msft-goog-report-snippets-compared.txt --arith

./gpt4e ask --questionfile test/samples/number-years-grow-30.txt
./gpt4e ask --questionfile test/samples/number-years-grow-30.txt --arith

./gpt4e ask --questionfile test/samples/gap-lulemon-financial-reports-compared.txt
./gpt4e ask --questionfile test/samples/gap-lulemon-financial-reports-compared.txt --arith
```

Try your own question:

```bash
./gpt4e ask --question "What is sin(13.31) where the input is in degrees?"
./gpt4e ask --question "What is sin(13.31) where the input is in degrees?" --arith
```

```bash
./gpt4e ask --question "Fred’s gross salary is \$850 per week. From his salary, 11% is removed for federal deductions; 5.5% for state deductions; and 6.2% for the company’s pension plan. If each of these deductions is taken as a percent of Fred’s gross salary, what is his net salary for a fourweek period?"

./gpt4e ask --question "Fred’s gross salary is \$850 per week. From his salary, 11% is removed for federal deductions; 5.5% for state deductions; and 6.2% for the company’s pension plan. If each of these deductions is taken as a percent of Fred’s gross salary, what is his net salary for a fourweek period?" --arith
```
