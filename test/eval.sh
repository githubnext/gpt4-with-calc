npm run build

./gpte eval --questionset calc --verbose > logs/log.calc.without
./gpte eval --questionset calc --arith --verbose > logs/log.calc.with

./gpte eval --questionset units --verbose > logs/log.units.without
./gpte eval --questionset units --arith --verbose > logs/log.units.with

./gpte eval --questionset finance --verbose > logs/log.finance.without
./gpte eval --questionset finance --arith --verbose > logs/log.finance.with

./gpte eval --questionset tables --verbose > logs/log.tables.without
./gpte eval --questionset tables --arith --verbose > logs/log.tables.with

./gpte eval --questionset dates --verbose > logs/log.dates.without
./gpte eval --questionset dates --arith --verbose > logs/log.dates.with

./gpte eval --questionset puzzles --verbose > logs/log.puzzles.without
./gpte eval --questionset puzzles --arith --verbose > logs/log.puzzles.with

# variations
./gpte eval --questionset puzzles --arith --verbose --emitChecks > logs/log.puzzles.with.emitChecks
./gpte eval --questionset puzzles --arith --verbose --noEliminateDateTime > logs/log.puzzles.with.noEliminateDateTime
./gpte eval --questionset puzzles --arith --verbose --noEmitComparisons > logs/log.puzzles.with.noEmitComparisons
./gpte eval --questionset puzzles --arith --verbose --noEmitUnits > logs/log.puzzles.with.noEmitUnits
./gpte eval --questionset puzzles --arith --verbose --noEmitDescriptions > logs/log.puzzles.with.noEmitDescriptions
 
CALC_TOTAL=`grep "CORRECT\|FAIL" logs/log.calc.with | wc -l`
echo "Raw calculation:"
echo "  Without equip:                    `grep CORRECT logs/log.calc.without | wc -l`/$CALC_TOTAL"
echo "  With equip:                       `grep CORRECT logs/log.calc.with | wc -l`/$CALC_TOTAL"

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

UNITS_TOTAL=`grep "CORRECT\|FAIL" logs/log.units.with | wc -l`
echo "Raw calculation:"
echo "  Without equip:                    `grep CORRECT logs/log.units.without | wc -l`/$UNITS_TOTAL"
echo "  With equip:                       `grep CORRECT logs/log.units.with | wc -l`/$UNITS_TOTAL"

echo "Math puzzles:"
echo "  Without equip:                    `grep FAIL logs/log.puzzles.without | wc -l` failures `grep CORRECT logs/log.puzzles.without | wc -l`/`grep \"CORRECT\|FAIL\" logs/log.puzzles.without | wc -l`"
echo "  With equip:                       `grep FAIL logs/log.puzzles.with | wc -l` failures `grep CORRECT logs/log.puzzles.with | wc -l`/`grep \"CORRECT\|FAIL\" logs/log.puzzles.with | wc -l`"
echo "  With equip (emitChecks):          `grep FAIL logs/log.puzzles.with.emitChecks | wc -l` failures `grep CORRECT logs/log.puzzles.with.emitChecks | wc -l`/`grep \"CORRECT\|FAIL\" logs/log.puzzles.with.emitChecks | wc -l`"
echo "  With equip (noEliminateDateTime): `grep FAIL logs/log.puzzles.with.noEliminateDateTime | wc -l` failures `grep CORRECT logs/log.puzzles.with.noEliminateDateTime | wc -l`/`grep \"CORRECT\|FAIL\" logs/log.puzzles.with.noEliminateDateTime | wc -l`"
echo "  With equip (noEmitComparisons):   `grep FAIL logs/log.puzzles.with.noEmitComparisons | wc -l` failures `grep CORRECT logs/log.puzzles.with.noEmitComparisons | wc -l`/`grep \"CORRECT\|FAIL\" logs/log.puzzles.with.noEmitComparisons | wc -l`"
echo "  With equip (noEmitUnits):         `grep FAIL logs/log.puzzles.with.noEmitUnits | wc -l` failures `grep CORRECT logs/log.puzzles.with.noEmitUnits | wc -l`/`grep \"CORRECT\|FAIL\" logs/log.puzzles.with.noEmitUnits | wc -l`"
echo "  With equip (noEmitDescriptions):  `grep FAIL logs/log.puzzles.with.noEmitDescriptions | wc -l` failures `grep CORRECT logs/log.puzzles.with.noEmitDescriptions | wc -l`/`grep \"CORRECT\|FAIL\" logs/log.puzzles.with.noEmitDescriptions | wc -l`"

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


# npm run build && ./gpte eval --arith --verbose --questions "$REGRESSIONS" 

# for k in $FAILS1; do
#     if [[ ! $FAILS2 =~ $k ]]; then
#         echo "New success: $k"
#         grep "FAIL: \[$k" logs/log.puzzles.with
#     fi
# done

