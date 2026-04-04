import { HomeIcon, UserIcon } from 'lucide-react';
import { FieldKeys, FormStep } from './types';

import { IEventSingleRoom, SEventSingleRoom } from '@/lib/schemas';
import React, { useMemo } from 'react';
import { Step1 } from './drawer-step-details';
import { Step2 } from './drawer-step-recurrence';

import { CombinedSchema, getStep1Schema, Step2Fields, step2Schema } from './drawer-schema.validator';
import { MultiStepForm } from './drawer-form-provider';
import { EventDrawerPermissions } from './lib/permissions';
import { useSession } from '@/contexts/SessionProvider';
import { usePrivateConfigurationQuery } from '@/lib/services/configuration';
import { TimeInterval } from '@/components/calendar-time-picker/useTimePicker';

export default function EventDrawer({
  creationDate,
  event,
  draft,
  userId,
  roomId,
  isOpen,
  onOpen,
  onClose,
}: {
  creationDate: Date;
  event?: IEventSingleRoom;
  draft?: CombinedSchema;
  userId?: string;
  roomId?: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const { data: config } = usePrivateConfigurationQuery(['visibleHoursStart', 'visibleHoursEnd', 'timeSlotInterval', 'maxBookingSpan']);

  const { can } = EventDrawerPermissions.usePermissions();

  const minHour = config?.visibleHoursStart ?? 0;
  const maxHour = config?.visibleHoursEnd ?? 24;
  const interval = (config?.timeSlotInterval ?? 30) as TimeInterval;
  const maxSpan = config?.maxBookingSpan ?? 0;

  const restrictHours = !can('IgnoreHours');

  const checkoutSteps: FormStep[] = useMemo(
    () => [
      {
        title: 'Step 1: Event Details',
        component: Step1,
        icon: UserIcon,
        position: 1,
        validationSchema: getStep1Schema(minHour, maxHour, restrictHours),
        fields: Object.keys(getStep1Schema(minHour, maxHour, restrictHours).shape) as FieldKeys[],
      },
      {
        title: 'Step 2: Recurrence',
        component: Step2,
        icon: HomeIcon,
        position: 2,
        validationSchema: step2Schema,
        fields: Object.keys(Step2Fields) as FieldKeys[],
      },
    ],
    [minHour, maxHour, restrictHours],
  );

  //parse(event) was recreating the same object over and over, causing the form to reset.
  const parsedEvent = useMemo(() => {
    if (!event) return undefined;
    return SEventSingleRoom.parse(event);
  }, [event]);

  return (
    <MultiStepForm
      //key={instanceKey}
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      creationDate={creationDate}
      formSteps={checkoutSteps}
      event={parsedEvent}
      draft={draft}
      userId={userId}
      roomId={roomId}
      minHour={minHour}
      maxHour={maxHour}
      interval={interval}
      maxSpan={maxSpan}
    ></MultiStepForm>
  );
}
