// use-rrule-preview.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { z } from 'zod/v4';
import { step2Schema } from './drawer-schema.validator';
import { getRRuleData, RRuleFieldValues } from './lib/rrule-preview-helper';

export function useRRulePreview(startDate: string) {
  const { control, setValue, trigger } = useFormContext<z.infer<typeof step2Schema>>();

  const [localDates, setLocalDates] = useState<Date[]>([]);
  const [count, setCount] = useState(0);
  const [isCalculating, setCalculating] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Watch all fields that impact the RRULE string
  const watchedFields = useWatch({
    control,
    name: [
      'untilDate',
      'repeatingType',
      'weekdays',
      'dailyPattern',
      'monthlyPattern',
      'yearlyPattern',
      'dayValue',
      'weekValue',
      'monthValue',
      'monthDayValue',
      'monthPeriodValue',
      'monthWeekdayValue',
      'yearValue',
      'yearDayValue',
      'yearMonthValue',
      'yearPeriodValue',
      'yearWeekdayValue',
      'occurrences',
      'durationType',
    ],
  });

  const fieldValues = useMemo(() => {
    // useWatch returns an array based on the 'name' array provided above
    const [
      untilDate,
      repeatingType,
      weekdays,
      dailyPattern,
      monthlyPattern,
      yearlyPattern,
      dayValue,
      weekValue,
      monthValue,
      monthDayValue,
      monthPeriodValue,
      monthWeekdayValue,
      yearValue,
      yearDayValue,
      yearMonthValue,
      yearPeriodValue,
      yearWeekdayValue,
      occurrences,
      durationType,
    ] = watchedFields;

    return {
      untilDate,
      repeatingType,
      weekdays,
      dailyPattern,
      monthlyPattern,
      yearlyPattern,
      dayValue,
      weekValue,
      monthValue,
      monthDayValue,
      monthPeriodValue,
      monthWeekdayValue,
      yearValue,
      yearDayValue,
      yearMonthValue,
      yearPeriodValue,
      yearWeekdayValue,
      occurrences,
      durationType,
    } as RRuleFieldValues;
  }, [watchedFields]);

  const watchedFieldsString = JSON.stringify(fieldValues);
  useEffect(() => {
    let isCancelled = false;
    setCalculating(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const fieldValues = JSON.parse(watchedFieldsString) as RRuleFieldValues;

        const data = await getRRuleData({ startDate, values: fieldValues });
        if (isCancelled) return;

        if (data.ruleString) {
          setValue('rule', data.ruleString);
          setValue('ruleDescription', data.ruleDescription);
          setValue('ruleStartDate', data.firstDate);

          setValue('ruleEndDate', data.lastDate);
          trigger(['rule', 'ruleStartDate', 'ruleEndDate']);
        }

        setLocalDates(data.localDates ?? []);
        setCount(data.count ?? 0);
      } catch (err) {
        console.error('RRULE Error:', err);
      } finally {
        if (!isCancelled) setCalculating(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [startDate, watchedFieldsString, setValue, trigger]);

  return { localDates, count, isCalculating };
}
