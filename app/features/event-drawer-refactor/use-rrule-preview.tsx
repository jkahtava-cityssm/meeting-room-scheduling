// use-rrule-preview.ts
import { useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { z } from "zod/v4";
import { step2Schema } from "../event-drawer/event-drawer.validator";
import { getRRuleData, RRuleFieldValues } from "../event-drawer/rrule-preview-helper";

export function useRRulePreview(startDate: string) {
  const { control, setValue, trigger, getValues } = useFormContext<z.infer<typeof step2Schema>>();

  const [localDates, setLocalDates] = useState<Date[]>([]);
  const [count, setCount] = useState(0);
  const [isCalculating, setCalculating] = useState(false);

  const prevValuesRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Watch all fields that impact the RRULE string
  const watchedFields = useWatch({
    control,
    name: [
      "untilDate",
      "repeatingType",
      "weekdays",
      "dailyPattern",
      "monthlyPattern",
      "yearlyPattern",
      "dayValue",
      "weekValue",
      "monthValue",
      "monthDayValue",
      "monthPeriodValue",
      "monthWeekdayValue",
      "yearValue",
      "yearDayValue",
      "yearMonthValue",
      "yearPeriodValue",
      "yearWeekdayValue",
      "occurrences",
      "durationType",
    ],
  }) as RRuleFieldValues;

  const watchedFieldsString = JSON.stringify(watchedFields);

  useEffect(() => {
    let isCancelled = false;
    setCalculating(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const fieldValues = JSON.parse(watchedFieldsString) as RRuleFieldValues;

        const data = await getRRuleData({ startDate, fieldValues });
        if (isCancelled) return;

        if (data.ruleString) {
          const temp_firstDate = new Date(data.firstDate!).getTime();
          const temp_startDate = new Date(startDate).getTime();

          setValue("rule", data.ruleString);
          setValue("ruleStartDate", data.firstDate);

          setValue("ruleEndDate", data.lastDate ?? "");
          trigger(["rule", "ruleStartDate", "ruleEndDate"]);
        }

        setLocalDates(data.localDates ?? []);
        setCount(data.count ?? 0);
      } catch (err) {
        console.error("RRULE Error:", err);
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
