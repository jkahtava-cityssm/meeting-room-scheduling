import { convertRRuleDateToDate } from '@/lib/helpers';
import { RRule } from 'rrule';
import { ParsedOptions } from 'rrule/dist/esm/types';

self.onmessage = (response: MessageEvent<ParsedOptions>) => {
  if (response.data) {
    const rrule = new RRule(response.data);

    // Calculate values inside the worker
    const total = rrule.count();
    const ruleList = rrule.all((_, len) => len < 500);
    const lastDate = rrule.all().at(-1);

    self.postMessage({
      ruleString: rrule.toString(),
      ruleDescription: rrule.toText(),
      count: total,
      firstDate: ruleList[0]?.toISOString(),
      lastDate: lastDate ? convertRRuleDateToDate(lastDate).toISOString() : undefined,
      localDates: ruleList.map(convertRRuleDateToDate),
    });
  }
};
