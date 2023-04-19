# scores gentest results against gold standard

import argparse
import glob
import json
import os.path
import re
import pandas as pd

# we ask things like:
# 1: I've created a new file tests/embedded_html/__init__.py with the content
# 2. I've extended the file cterasdk/object/Portal.py by changing
# want to detect the lines where this is asked
FILE_REGEXES = [
  r'^I\'ve created a new file (.*) with the content',
  r'^I\'ve extended the file (.*) by changing',
]
# then look for a question like
QUESTION_REGEX = 'Please reply in the following format:'
# then we look for yes / no
GOLD_STANDARD_FILE = 'scorer/baseline_needs_test.csv'

def main():
  parser = argparse.ArgumentParser(
  )

  parser.add_argument('baseline_path')
  parser.add_argument('--output_individual_files', dest='output_individual_files', default='false', action='store_true')
  

  args = parser.parse_args()

  # get gold standard
  gold_standard_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), GOLD_STANDARD_FILE)
  # this is a csv file with three interesting columns: slug, file and testworthy
  gold_standard = pd.read_csv(gold_standard_path)

  baseline_files = glob.glob(args.baseline_path + '/**/gentest.json', recursive=True)

  score_totals = {
    'needs_tests_true_positive': 0,
    'needs_tests_false_positive': 0,
    'needs_tests_false_negative': 0,
    'needs_tests_true_negative': 0,
    'test_urgency_when_required': [],
    'test_urgency_when_not_required': [],
    'compiling': 0,
    'non_compiling': 0,
    'num_units': 0,
    'num_lines': 0,
  }

  overall_scoring_file = os.path.join(args.baseline_path, 'scores.json')
  overall_scores = load_or_give_empty(overall_scoring_file)
  overall_scores['gentest'] = {'details': {}}
  
  for baseline_file in baseline_files:
    with open(baseline_file) as f:
      gentest_json = json.loads(f.read())

      scoring_file = scoring_file_path(baseline_file)
      scores = load_or_give_empty(scoring_file)
      scores['gentest'] = {}
      print("Processing: " + baseline_file)
     
      calculate_scores(gentest_json, scores['gentest'], baseline_file, score_totals, gold_standard)
      if len(scores['gentest']) > 0:
        if args.output_individual_files == 'true':
          with open(scoring_file, 'w') as f:
            print("Writing scores to: " + scoring_file)
            json.dump(scores, f, indent=2, sort_keys=True)
        # add this to overall_scores['gentest']['details']
        overall_scores['gentest']['details'][baseline_file] = scores['gentest']
      
  # now remember the totals
  overall_scores['gentest']['summaries'] = score_totals
  print(overall_scores)
  with open(overall_scoring_file, 'w') as f:
    json.dump(overall_scores, f, indent=2) 

  print('----------')
  print('score totals for "Does this need tests?":')
  print(f'  tests deemed necessary: {score_totals["needs_tests_true_positive"] + score_totals["needs_tests_false_positive"]} (of which correct: {score_totals["needs_tests_true_positive"]})')
  print(f'  tests deemed unnecessary: {score_totals["needs_tests_true_negative"] + score_totals["needs_tests_false_negative"]} (of which correct: {score_totals["needs_tests_true_negative"]})')
  print(f'  precision/recall/f1: {score_totals["needs_tests_precision"]}/{score_totals["needs_tests_recall"]}/{score_totals["needs_tests_f1"]}')
  print('score totals for the tests themselves:')
  print(f'  compiling: {score_totals["compiling"]} out of {score_totals["compiling"] + score_totals["non_compiling"]} ({round(score_totals["compiling"] / (score_totals["compiling"] + score_totals["non_compiling"]), 2)})')
  print(f'  generated lines per tested file: {round(score_totals["num_lines"] / (score_totals["compiling"] + score_totals["non_compiling"]), 2)}')
  print(f'  predicted units per tested file: {round(score_totals["num_units"] / (score_totals["compiling"] + score_totals["non_compiling"]), 2)}')

  print("Written overall scores to: " + overall_scoring_file)

def calculate_scores(gentest_txt, scores, file_path, score_totals, gold_standard):
  """Modifies scores in place, adding keys for each metric"""
  try:
    # has aiSuggestedTests and aiEschewedTests, each have testedFile and testUrgency
    for test in gentest_txt['aiSuggestedTests'] + gentest_txt['aiEschewedTests']:
      add_score(test['testedFile'], file_path, test['testUrgency'] > 0.5, scores, score_totals, gold_standard, test['testUrgency'], test['tests'] if "tests" in test else [], "\n".join(test['content'] if "content" in test else ""))

    tps = score_totals['needs_tests_true_positive']
    fps = score_totals['needs_tests_false_positive']
    fns = score_totals['needs_tests_false_negative']
    prec = tps / (tps + fps) if tps + fps > 0 else 0
    rec = tps / (tps + fns) if tps + fns > 0 else 0
    f1 = 2 * prec * rec / (prec + rec) if prec + rec > 0 else 0
    score_totals['needs_tests_precision'] = round(prec, 2)
    score_totals['needs_tests_recall'] = round(rec, 2)
    score_totals['needs_tests_f1'] = round(f1, 2)
  except Exception as e:
    print("error calculating scores: ", e)

def add_score(specific_file, file_path, answer, scores, score_totals, gold_standard, urgency, tests, content):
  gold_standard_answer = get_gold_standard(specific_file, file_path, gold_standard)
  scores[specific_file] = {
    'actually_needs_tests': gold_standard_answer,
    'needs_tests_predicted': answer,
    'urgency': urgency,
  }
  if answer:
    scores[specific_file]['num_units'] = len(tests)
    score_totals['num_units'] += scores[specific_file]['num_units']
  # the following only make sense if there is any content
  if content:
    scores[specific_file]['num_lines'] = len(content.splitlines())
    score_totals['num_lines'] += scores[specific_file]['num_lines']
    if specific_file.endswith('.py'):
      try:
        
        compile(content, '<string>', 'exec')
        scores[specific_file]['compiles'] = True
      except Exception:
        scores[specific_file]['compiles'] = False

    score_totals['compiling'] += scores[specific_file]['compiles']
    score_totals['non_compiling'] += not scores[specific_file]['compiles']
    

  if gold_standard_answer is None:
    return
  correct = gold_standard_answer == answer
  score_totals['needs_tests_true_positive'] += 1 if correct and answer else 0
  score_totals['needs_tests_true_negative'] += 1 if correct and not answer else 0
  score_totals['needs_tests_false_positive'] += 1 if not correct and answer else 0
  score_totals['needs_tests_false_negative'] += 1 if not correct and not answer else 0
  if gold_standard_answer:
    score_totals['test_urgency_when_required'] += [urgency]
  else:
    score_totals['test_urgency_when_not_required'] += [urgency]

def get_gold_standard(specific_file, file_path, gold_standard):
  # extract from gold standard the answer column on the line where:
  # - column slug is a substring of the file path (i.e. the filepath is the longer string)
  # - column file is equal to the specific file
  gold_answers = gold_standard.loc[gold_standard['slug'].apply(lambda x: str(x) in file_path) & (gold_standard['file'] == specific_file)]['testworthy']
  if len(gold_answers) != 1:
    print("no single gold standard answer found for ", file_path, specific_file, len(gold_answers))
    return None
  first_gold_answer = gold_answers.iloc[0]
  if first_gold_answer.lower() == 'yes':
    return True
  elif first_gold_answer.lower() == 'no':
    return False
  else:
    return None

def scoring_file_path(baseline_file):
  dirname = os.path.dirname(baseline_file)
  return os.path.join(dirname, 'scoring.json')

def load_or_give_empty(scoring_file):
  if os.path.exists(scoring_file):
    with open(scoring_file) as f:
      return json.load(f)
  else:
    return {}

if __name__ == '__main__':
  main()