npm run build && ./gpt4e eval --verbose > log
npm run build && ./gpt4e eval --arith --verbose > log2
npm run build && ./gpt4e eval --arith --verbose --noEliminateDateTime > log2.noEliminateDateTime
npm run build && ./gpt4e eval --arith --verbose --noEmitChecks > log2.noEmitChecks
npm run build && ./gpt4e eval --arith --verbose --noEmitComparisons > log2.noEmitComparisons
npm run build && ./gpt4e eval --arith --verbose --noEmitUnits > log2.noEmitUnits
npm run build && ./gpt4e eval --arith --verbose --noEmitDescriptions > log2.noEmitDescriptions
 
echo "Without equip:                    `grep FAIL log | wc -l` failures"
echo "With equip:                       `grep FAIL log2 | wc -l` failures"
echo "With equip (noEliminateDateTime): `grep FAIL log2.noEliminateDateTime | wc -l` failures"
echo "With equip (noEmitChecks):        `grep FAIL log2.noEmitChecks | wc -l` failures"
echo "With equip (noEmitComparisons):   `grep FAIL log2.noEmitComparisons | wc -l` failures"
echo "With equip (noEmitUnits):         `grep FAIL log2.noEmitUnits | wc -l` failures"
echo "With equip (noEmitDescriptions):  `grep FAIL log2.noEmitDescriptions | wc -l` failures"

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

# Find the failures in log
FAILS1=`grep FAIL log | cut -d',' -f1 | cut -d'[' -f2`

FAILS2=`grep FAIL log2 | cut -d',' -f1 | cut -d'[' -f2`

# Find the failures in log2 that aren't in log and add them to REGRESSIONS
REGRESSIONS=""
for k in $FAILS2; do
    if [[ ! $FAILS1 =~ $k ]]; then
        fail=`grep "FAIL: \[$k" log2`
        echo "Regression: $fail"
        REGRESSIONS="$REGRESSIONS $k"
    fi
done


# npm run build && ./gpt4e eval --arith --verbose --questions "$REGRESSIONS" 

# for k in $FAILS1; do
#     if [[ ! $FAILS2 =~ $k ]]; then
#         echo "New success: $k"
#         grep "FAIL: \[$k" log2
#     fi
# done

