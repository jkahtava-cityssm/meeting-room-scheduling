/**
 * Validate cron expression format
 * Basic validation using cron-parser or regex
 */
export function validateCronExpression(cron: string): boolean {
  // Basic regex: 5 fields separated by spaces
  const cronRegex =
    /^(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*|\?)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)$/;
  return cronRegex.test(cron.trim());
}

export function getNextCronOccurrence(cron: string): string | null {
  const parts = cron.split(/\s+/);
  if (parts.length < 4) return null;

  const [mStr, hStr, dStr, moStr] = parts;

  // Early Validation & Parsing
  const parsePart = (s: string) => (s === '*' ? null : parseInt(s, 10));

  const targetHour = parsePart(hStr);
  const targetDay = parsePart(dStr);
  const targetMonth = parsePart(moStr);
  const tempMinute = parseInt(mStr, 10);

  if (isNaN(tempMinute)) return null;
  if (targetHour !== null && (targetHour < 0 || targetHour > 23)) return null;
  if (targetDay !== null && (targetDay < 1 || targetDay > 31)) return null;
  if (targetMonth !== null && (targetMonth < 1 || targetMonth > 12)) return null;

  const now = new Date();
  const next = new Date(now.getTime());
  next.setSeconds(0, 0);
  next.setMilliseconds(0);

  // Clamp Minute to intervals
  const intervals = [0, 15, 30, 45];
  let targetMinute: number;

  const clamped = intervals.find((i) => i >= tempMinute);

  if (clamped === undefined) {
    // If input was 46-59, we move to the 00 mark of the NEXT hour
    targetMinute = 0;
    next.setHours(next.getHours() + 1);
  } else {
    targetMinute = clamped;
  }

  // If the clamped target is in the past/current minute of this hour, move to next hour
  if (next.getHours() === now.getHours() && targetMinute <= now.getMinutes()) {
    next.setHours(next.getHours() + 1);
  }

  next.setMinutes(targetMinute);

  // 2. Matching Loop
  let iterations = 0;
  while (iterations < 500) {
    const curMonth = next.getMonth() + 1;
    const curDay = next.getDate();
    const curHour = next.getHours();

    if (targetMonth !== null && targetMonth !== curMonth) {
      next.setMonth(next.getMonth() + 1, 1);
      next.setHours(0, targetMinute, 0, 0);
      iterations++;
      continue;
    }

    if (targetDay !== null && targetDay !== curDay) {
      next.setDate(targetDay);
      if (next.getDate() !== targetDay) {
        next.setMonth(next.getMonth() + 1, 1);
      }
      next.setHours(0, targetMinute, 0, 0);
      iterations++;
      continue;
    }

    if (targetHour !== null && targetHour !== curHour) {
      next.setHours(next.getHours() + 1, targetMinute, 0, 0);
      iterations++;
      continue;
    }

    return next.toISOString();
  }

  return null;
}
