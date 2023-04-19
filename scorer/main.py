import argparse
import glob
import json
import os.path
from rouge_score import rouge_scorer
from nltk.translate.bleu_score import sentence_bleu
import textstat
import stop_words
from rouge_score import tokenizers
import re

from markdown import Markdown
from io import StringIO

def camel_case_split(identifier):
    matches = re.finditer('.+?(?:(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|$)', identifier)
    return [m.group(0) for m in matches]

def snake_case_split(indentifier):
    return indentifier.split('_')

def unmark_element(element, stream=None):
    if stream is None:
        stream = StringIO()
    if element.tag == 'code':
        #split code into words
        words = camel_case_split(element.text)
        for word in words:
            wwords = snake_case_split(word)
            for wword in wwords:
                stream.write(wword)
                stream.write(' ')
    elif element.text:
        stream.write(element.text)
    for sub in element:
        unmark_element(sub, stream)
    if element.tail:
        stream.write(element.tail)
    return stream.getvalue()


# patching Markdown
Markdown.output_formats["plain"] = unmark_element
__md = Markdown(output_format="plain")
__md.stripTopLevelTags = False


def unmark(text):
    return __md.convert(text)

class TokenizerWithoutStopwords(tokenizers.Tokenizer):
  def __init__(self, use_stemmer=True):
    self.inner_tokenizer = tokenizers.DefaultTokenizer(use_stemmer=use_stemmer)
    self.stop_words = frozenset([self.inner_tokenizer.tokenize(x)[0] for x in
      stop_words.get_stop_words('en')])

  def tokenize(self, text):
    text_with_stopwords = self.inner_tokenizer.tokenize(text)
    return [x for x in text_with_stopwords if x not in self.stop_words]


def main():
  parser = argparse.ArgumentParser(
  )

  parser.add_argument('baseline_path')

  args = parser.parse_args()

  baseline_files = glob.glob(args.baseline_path + '/**/describe.json', recursive=True)

  for baseline_file in baseline_files:
    with open(baseline_file) as f:
      describe_json = json.load(f)
      scoring_file = scoring_file_path(baseline_file)
      scores = {}
      scores['describe'] = {}
      print("Processing: " + baseline_file)

      calculate_scores(describe_json, scores['describe'], baseline_file)
      if len(scores['describe']) > 0:
        with open(scoring_file, 'w') as f:
          json.dump(scores, f, indent=2)
      else:
        if os.path.exists(scoring_file):
          print("removing " + scoring_file)
          os.remove(scoring_file)

def calculate_scores(describe_json, scores, file_path):
  """Modifies scores in place, adding keys for each metric"""
  print("scoring ", file_path)
  try:
    if 'aiSummary' not in describe_json:
      print("skipping; no aiSummary")
      return
    if 'aiWalkthrough' not in describe_json:
      print("skipping; no aiWalkthrough")
      return
    if 'body' not in describe_json or describe_json['body'] is None:
      print("skipping; no body")
      return
    summary_human = describe_json['body']
    summary_section = attempt_to_extract_summary(summary_human)
    if (summary_section is not None):
      scores['full_human'] = summary_human
      summary_human = summary_section

    # remove HTML comments
    summary_human = re.sub(r'<!--([^-]|-[^-])*-->', '', summary_human, flags=re.DOTALL)
    summary_human = unmark(summary_human)

    walkthrough_human = describe_json['body']
    walkthrough_human = re.sub(r'<!--([^-]|-[^-])*-->', '', walkthrough_human, flags=re.DOTALL)
    walkthrough_human = unmark(walkthrough_human)

    summary_prbot = unmark(describe_json['aiSummary']['summary'])
    walkthrough_prbot = unmark(describe_json['aiWalkthrough']['text'])

    scores['summary_human'] = summary_human
    scores['summary_prbot'] = summary_prbot

    scores['walkthrough_human'] = walkthrough_human
    scores['walkthrough_prbot'] = walkthrough_prbot

    # ROUGE without stopwords
    scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2'], use_stemmer=True, tokenizer=TokenizerWithoutStopwords())
    summary_rouge_scores = scorer.score(summary_human, summary_prbot)
    scores['summary_rouge1'] = rouge_score_to_json(summary_rouge_scores['rouge1'])
    scores['summary_rouge2'] = rouge_score_to_json(summary_rouge_scores['rouge2'])

    walkthrough_rouge_scores = scorer.score(walkthrough_human, walkthrough_prbot)
    scores['walkthrough_rouge1'] = rouge_score_to_json(walkthrough_rouge_scores['rouge1'])
    scores['walkthrough_rouge2'] = rouge_score_to_json(walkthrough_rouge_scores['rouge2'])

    # BLEU without stopwords and stemmed
    summary_human_stemmed = ' '.join(TokenizerWithoutStopwords().tokenize(summary_human))
    summary_prbot_stemmed = ' '.join(TokenizerWithoutStopwords().tokenize(summary_prbot))
    scores['summary_bleu'] = sentence_bleu([summary_human_stemmed], summary_prbot_stemmed)
    scores['summary_bleu1'] = sentence_bleu([summary_human_stemmed], summary_prbot_stemmed, weights=(1, 0, 0, 0))
    scores['summary_bleu2'] = sentence_bleu([summary_human_stemmed], summary_prbot_stemmed, weights=(0, 1, 0, 0))

    walkthrough_human_stemmed = ' '.join(TokenizerWithoutStopwords().tokenize(walkthrough_human))
    walkthrough_prbot_stemmed = ' '.join(TokenizerWithoutStopwords().tokenize(walkthrough_prbot))
    scores['walkthrough_bleu'] = sentence_bleu([walkthrough_human_stemmed], walkthrough_prbot_stemmed)
    scores['walkthrough_bleu1'] = sentence_bleu([walkthrough_human_stemmed], walkthrough_prbot_stemmed, weights=(1, 0, 0, 0))
    scores['walkthrough_bleu2'] = sentence_bleu([walkthrough_human_stemmed], walkthrough_prbot_stemmed, weights=(0, 1, 0, 0))

    # READABILITY
    scores['summary_flesch'] = textstat.textstat.flesch_reading_ease(summary_prbot)
    scores['walkthrough_flesch'] = textstat.textstat.flesch_reading_ease(walkthrough_prbot)

  except Exception as e:
    print("error calculating scores", e)

def rouge_score_to_json(score):
  return {
    'precision': score.precision,
    'recall': score.recall,
    'fmeasure': score.fmeasure
  }

def scoring_file_path(baseline_file):
  dirname = os.path.dirname(baseline_file)
  return os.path.join(dirname, 'scoring.json')

def attempt_to_extract_summary(body):
  """Looks for a Markdown summary section in the body and returns it if found."""
  lines = body.split('\n')
  found_summary = False
  summary_lines = []
  num_hash_chars = 0
  for i, line in enumerate(lines):
    if not found_summary:
      # regular expression to search for 1-6 # characters followed by 'Summary'
      match = re.search(r'^(#{1,6})\s*Summary', line)
      if match:
        num_hash_chars = len(match.group(1))
        found_summary = True
    else:
      # find the next section that has fewer or equal # characters as the
      # summary heading
      match = re.search(r'^(#{1,6})\s*\S', line)
      if match:
        if len(match.group(1)) <= num_hash_chars:
          break
      summary_lines.append(line)

  if (len(summary_lines) > 0):
    return '\n'.join(summary_lines)

  return None

if __name__ == '__main__':
  main()