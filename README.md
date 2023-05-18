# GPT-4 Equipped with Numeric Calculation

GPT-4 has trouble with calculating with numbers. We look at a technique to fix that.

[**Read the report - GPT-4 Equipped with Numeric Calculation**](docs/report.md)

[**Read the evaluation**](docs/eval.md)

> NOTE: The default model used when running this code is OpenAI's **`text-davinci-003`** and not GPT-4. The code can be adjusted to run against any completion API by changing the settings in [`src/engine/options.ts`](src/engine/options.ts) and [`src/engine/settings.ts`](src/engine/settings.ts).
>
> When writing this report, we evaluated the technique using the completion API of a private release of GPT-4. The public release of GPT-4 currently only provides a "chat" API. As a result some aspects of the technique described may need to be reworked because of this, however we are providing the code and our investigation for reference. We believe the evaluation results remain valid although some variation in numbers is to be expected.

## Requirements

```sh
sudo apt-get install npm
npm install
npm run build
```

## Examples

Define an API key:

```bash
export OPENAI_API_KEY=...
```

Try your own question:

```bash
./gpte ask --question "What is sin(13.31) where the input is in degrees?"
./gpte ask --question "What is sin(13.31) where the input is in degrees?" --arith

./gpte ask --questionfile test/samples/number-years-grow-30.txt
./gpte ask --questionfile test/samples/number-years-grow-30.txt --arith
```

These examples require GPT-4 token window size, code generation and reasoning:

```bash
./gpte ask --questionfile test/samples/msft-report-snippet.txt
./gpte ask --questionfile test/samples/msft-report-snippet.txt --arith

./gpte ask --questionfile test/samples/msft-goog-report-snippets-compared.txt
./gpte ask --questionfile test/samples/msft-goog-report-snippets-compared.txt --arith

./gpte ask --questionfile test/samples/gap-lulemon-financial-reports-compared.txt
./gpte ask --questionfile test/samples/gap-lulemon-financial-reports-compared.txt --arith
```

With an appropriate model, entire problem sets can be evaluated using `./gpte eval`.

## License

This project is licensed under the terms of the MIT open source license. Please refer to [MIT](./LICENSE.txt) for the full terms.

## Maintainers

Maintainers: @dsyme, @wunderalbert, @johanrosenkilde

## Support

This project is a concluded technical investigation by GitHub Next. It is provided for reference.

## Acknowledgement

This project includes a modified version of the [`ASDiv.xml` dataset](https://github.com/chaochun/nlu-asdiv-dataset/blob/master/dataset/ASDiv.xml) for numeric calculation problems, adapted primarily to clarify the precisions and formats required in answers, see the [evaluation](docs/eval.md).
