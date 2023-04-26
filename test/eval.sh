npm run build

./gpt4e eval --questionset calc --verbose > logs/log.calc.without
./gpt4e eval --questionset calc --arith --verbose > logs/log.calc.with

./gpt4e eval --questionset units --verbose > logs/log.units.without
./gpt4e eval --questionset units --arith --verbose > logs/log.units.with

./gpt4e eval --questionset finance --verbose > logs/log.finance.without
./gpt4e eval --questionset finance --arith --verbose > logs/log.finance.with

./gpt4e eval --questionset tables --verbose > logs/log.tables.without
./gpt4e eval --questionset tables --arith --verbose > logs/log.tables.with

./gpt4e eval --questionset dates --verbose > logs/log.dates.without
./gpt4e eval --questionset dates --arith --verbose > logs/log.dates.with

./gpt4e eval --questionset puzzles --verbose > logs/log.puzzles.without
./gpt4e eval --questionset puzzles --arith --verbose > logs/log.puzzles.with

# variations
./gpt4e eval --questionset puzzles --arith --verbose --emitChecks > logs/log.puzzles.with.emitChecks
./gpt4e eval --questionset puzzles --arith --verbose --noEliminateDateTime > logs/log.puzzles.with.noEliminateDateTime
./gpt4e eval --questionset puzzles --arith --verbose --noEmitComparisons > logs/log.puzzles.with.noEmitComparisons
./gpt4e eval --questionset puzzles --arith --verbose --noEmitUnits > logs/log.puzzles.with.noEmitUnits
./gpt4e eval --questionset puzzles --arith --verbose --noEmitDescriptions > logs/log.puzzles.with.noEmitDescriptions
 
CALC_TOTAL=`grep "CORRECT\|FAIL" logs/log.calc.with | wc -l`
echo "Raw calculation:"
echo "  Without equip:                    `grep CORRECT logs/log.calc.without | wc -l`/$CALC_TOTAL"
echo "  With equip:                       `grep CORRECT logs/log.calc.with | wc -l`/$CALC_TOTAL"

UNITS_TOTAL=`grep "CORRECT\|FAIL" logs/log.units.with | wc -l`
echo "Raw calculation:"
echo "  Without equip:                    `grep CORRECT logs/log.units.without | wc -l`/$UNITS_TOTAL"
echo "  With equip:                       `grep CORRECT logs/log.units.with | wc -l`/$UNITS_TOTAL"

FINANCE_TOTAL=`grep "CORRECT\|FAIL" logs/log.finance.with | wc -l`
echo "Raw calculation:"
echo "  Without equip:                    `grep CORRECT logs/log.finance.without | wc -l`/$FINANCE_TOTAL"
echo "  With equip:                       `grep CORRECT logs/log.finance.with | wc -l`/$FINANCE_TOTAL"

TABLES_TOTAL=`grep "CORRECT\|FAIL" logs/log.tables.with | wc -l`
echo "Raw calculation:"
echo "  Without equip:                    `grep CORRECT logs/log.tables.without | wc -l`/$TABLES_TOTAL"
echo "  With equip:                       `grep CORRECT logs/log.tables.with | wc -l`/$TABLES_TOTAL"

DATES_TOTAL=`grep "CORRECT\|FAIL" logs/log.dates.with | wc -l`
echo "Raw calculation:"
echo "  Without equip:                    `grep CORRECT logs/log.dates.without | wc -l`/$DATES_TOTAL"
echo "  With equip:                       `grep CORRECT logs/log.dates.with | wc -l`/$DATES_TOTAL"

PUZZLES_TOTAL=`grep "CORRECT\|FAIL" logs/log.puzzles.without | wc -l`
echo "Math puzzles:"
echo "  Without equip:                    `grep FAIL logs/log.puzzles.without | wc -l` failures from $PUZZLES_TOTAL"
echo "  With equip:                       `grep FAIL logs/log.puzzles.with | wc -l` failures from $PUZZLES_TOTAL"
echo "  With equip (emitChecks):          `grep FAIL logs/log.puzzles.with.emitChecks | wc -l` failures from $PUZZLES_TOTAL"
echo "  With equip (noEliminateDateTime): `grep FAIL logs/log.puzzles.with.noEliminateDateTime | wc -l` failures from $PUZZLES_TOTAL"
echo "  With equip (noEmitComparisons):   `grep FAIL logs/log.puzzles.with.noEmitComparisons | wc -l` failures from $PUZZLES_TOTAL"
echo "  With equip (noEmitUnits):         `grep FAIL logs/log.puzzles.with.noEmitUnits | wc -l` failures from $PUZZLES_TOTAL"
echo "  With equip (noEmitDescriptions):  `grep FAIL logs/log.puzzles.with.noEmitDescriptions | wc -l` failures from $PUZZLES_TOTAL"

for k in \
   "grade 1"\
   "grade 2"\
   "grade 3"\
   "grade 4"\
   "grade 5"\
   "grade 6"; do
    echo "$k: `(grep FAIL logs/log.puzzles.without | grep "$k" | wc -l)` --> `(grep FAIL logs/log.puzzles.with | grep "$k" | wc -l)`";
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
    echo "$k: `(grep FAIL logs/log.puzzles.without | grep "type $k" | wc -l)` --> `(grep FAIL logs/log.puzzles.with | grep "type $k" | wc -l)`";
done

# Find the failures in logs/log.puzzles.without
FAILS1=`grep FAIL logs/log.puzzles.without | cut -d',' -f1 | cut -d'[' -f2`

# Find the failures in logs/log.puzzles.with
FAILS2=`grep FAIL logs/log.puzzles.with | cut -d',' -f1 | cut -d'[' -f2`

# Find the regressions
REGRESSIONS=""
for k in $FAILS2; do
    if [[ ! $FAILS1 =~ $k ]]; then
        fail=`grep "FAIL: \[$k" logs/log.puzzles.with`
        echo "Regression: $fail"
        REGRESSIONS="$REGRESSIONS $k"
    fi
done


# npm run build && ./gpt4e eval --arith --verbose --questions "$REGRESSIONS" 

# for k in $FAILS1; do
#     if [[ ! $FAILS2 =~ $k ]]; then
#         echo "New success: $k"
#         grep "FAIL: \[$k" logs/log.puzzles.with
#     fi
# done

