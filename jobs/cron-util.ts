/**
 * Validate cron expression format
 * Basic validation using cron-parser or regex
 */
export function validateCronExpression(cron: string): boolean {
  const atom = `(\\*|(\\d+(-\\d+)?)(/\\d+)?|\\d+(,\\d+)*|\\?)`;
  const cron6Regex = new RegExp(`^${atom}\\s+${atom}\\s+${atom}\\s+${atom}\\s+${atom}\\s+${atom}$`);

  return cron6Regex.test(cron.trim());
}

export function getNextCronOccurrence(cron: string): string | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 6) return null;

  const [sStr, mStr, hStr, dStr, moStr] = parts;

  const parsePart = (s: string) => (s === '*' ? null : parseInt(s, 10));

  // Determine second interval step (e.g., "*/30", "*" or "0")
  let secondStep = 0;
  if (sStr.startsWith('*/')) {
    secondStep = parseInt(sStr.replace('*/', ''), 10) || 30;
  } else if (sStr !== '*') {
    secondStep = parseInt(sStr, 10) || 0;
  }

  // Early Validation & Parsing

  const targetMinute = parsePart(mStr);
  const targetHour = parsePart(hStr);
  const targetDay = parsePart(dStr);
  const targetMonth = parsePart(moStr);

  if (secondStep < 0 || secondStep > 59) return null;
  if (targetMinute !== null && (targetMinute < 0 || targetMinute > 59)) return null;
  if (targetHour !== null && (targetHour < 0 || targetHour > 23)) return null;
  if (targetDay !== null && (targetDay < 1 || targetDay > 31)) return null;
  if (targetMonth !== null && (targetMonth < 1 || targetMonth > 12)) return null;

  const now = new Date();
  const next = new Date(now.getTime());

  next.setMilliseconds(0);

  if (secondStep > 0) {
    const currentSeconds = next.getSeconds();
    // Find the next step remainder
    const remainder = currentSeconds % secondStep;
    const secondsToAdd = secondStep - remainder;

    next.setSeconds(currentSeconds + secondsToAdd);
  } else {
    // If running exact seconds, move ahead by 1 minute if we are past the exact match
    next.setSeconds(sStr === '*' ? next.getSeconds() + 1 : parseInt(sStr, 10));
    if (next <= now) {
      next.setMinutes(next.getMinutes() + 1);
    }
  }

  let iterations = 0;
  while (iterations < 500) {
    const curMonth = next.getMonth() + 1;
    const curDay = next.getDate();
    const curHour = next.getHours();
    const curMinute = next.getMinutes();

    if (targetMonth !== null && targetMonth !== curMonth) {
      next.setMonth(next.getMonth() + 1, 1);
      next.setHours(0, targetMinute ?? 0, 0, 0);
      iterations++;
      continue;
    }

    if (targetDay !== null && targetDay !== curDay) {
      next.setDate(targetDay);
      if (next.getDate() !== targetDay) {
        next.setMonth(next.getMonth() + 1, 1);
      }
      next.setHours(0, targetMinute ?? 0, 0, 0);
      iterations++;
      continue;
    }

    if (targetHour !== null && targetHour !== curHour) {
      next.setHours(next.getHours() + 1, targetMinute ?? 0, 0, 0);
      iterations++;
      continue;
    }

    if (targetMinute !== null && targetMinute !== curMinute) {
      next.setMinutes(next.getMinutes() + 1, 0, 0);
      iterations++;
      continue;
    }

    return next.toISOString();
  }

  return null;
}
