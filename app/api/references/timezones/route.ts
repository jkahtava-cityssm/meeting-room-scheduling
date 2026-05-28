import { guardRoute } from '@/lib/api-guard';
import { InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return guardRoute(
    req,
    { isPrivate: { type: 'role', role: 'Private' } },

    async () => {
      const timezones = await getFriendlyTimezones();

      if (!timezones) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Timezones', timezones);
    },
  );
}

function getFriendlyTimezones() {
  const ianaZones = Intl.supportedValuesOf('timeZone');

  // Use a fixed pivot date to calculate standard GMT/UTC offsets accurately
  const pivotDate = new Date('2026-01-01T00:00:00Z');

  return ianaZones
    .map((zone) => {
      //Get the GMT offset string (e.g., "-04:00" or "Z")
      const offsetPart =
        new Intl.DateTimeFormat('en-CA', {
          timeZone: zone,
          timeZoneName: 'longOffset',
        })
          .formatToParts(pivotDate)
          .find((p) => p.type === 'timeZoneName')?.value || 'GMT+00:00';

      //Standardize "GMT" vs "UTC" naming representation
      const cleanOffset = offsetPart === 'GMT' ? '(GMT+00:00)' : `(${offsetPart.replace('GMT', 'GMT')})`;

      return {
        value: zone,
        label: `${cleanOffset} ${zone.replace(/_/g, ' ')}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
