import { convertRRuleDateToDate } from "@/lib/helpers";
import { RRule } from "rrule";
import { ParsedOptions } from "rrule/dist/esm/types";

self.onmessage = (response: MessageEvent<ParsedOptions>) => {
  if (response.data) {
    const rrule: RRule = new RRule(response.data);
    //This iterates over every rrule, so for some options it takes seconds
    const total = rrule.count();

    const ruleList = rrule.all((date, len) => {
      return len < 500;
    });

    const lastDate = rrule.all().at(-1);

    const convertedRuleList = ruleList.map(convertRRuleDateToDate);

    self.postMessage({ rrule: rrule, count: total, lastDate: lastDate, localDates: convertedRuleList });
  }
};
