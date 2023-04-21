# npm run build && ./gpt4e eval --verbose > log
# npm run build && ./gpt4e eval --arith --verbose > log2
 
echo "GPT-4: `grep FAIL log | wc -l` failures"
echo "GPT-4e: `grep FAIL log2 | wc -l` failures"

for k in \
   "grade 1"\
   "grade 2"\
   "grade 3"\
   "grade 4"\
   "grade 5"\
   "grade 6"; do
    echo "$k: `(grep FAIL log | grep "$k" | wc -l)` --> `(grep FAIL log2 | grep "$k" | wc -l)`";
done

#"TVQ-Change"\
#"Number-Operation"\

for k in \
   "Addition"\
   "Subtraction"\
   "Sum"\
   "Multiplication"\
   "Ceil-Division"\
   "Floor-Division"\
   "Common-Division"\
   "Comparison"\
   "TVQ-Final"\
   "Ratio"\
   "Sequential-Operation"\
   "LCM"\
   "GCD"\
   "Surplus"\
   "Algebra-1"\
   "Algebra-2"; do
    echo "$k: `(grep FAIL log | grep "type $k" | wc -l)` --> `(grep FAIL log2 | grep "type $k" | wc -l)`";
done



