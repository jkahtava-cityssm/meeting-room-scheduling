'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { Dispatch, SetStateAction } from 'react';

import type { TVisibleHours } from '@/lib/types';
import { VISIBLE_HOURS } from '../lib/helpers';
import { PUBLIC_IROOM, usePublicConfiguration, usePublicRoomsQuery } from '@/lib/services/public';
import { useRoomsQuery } from '@/lib/services/rooms';
import { IRoom } from '@/lib/schemas';

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  selectedRoomId: string;
  setSelectedRoomId: (roomId: string) => void;
  visibleRooms: PUBLIC_IROOM[] | undefined;
  visibleHours: TVisibleHours | undefined;
  fallbackHours: number[];
  interval: number;
  configurationError: Error | null;
  roomError: Error | null;
  isConfigurationPending: boolean;
  isRoomsPending: boolean;
  //setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
}

const CalendarContext = createContext({} as ICalendarContext);

export function CalendarProviderPublic({ children }: { children: React.ReactNode }) {
  const { data: config, error: configurationError, isPending: isConfigurationPending } = usePublicConfiguration();
  const { data: visibleRooms, error: roomError, isPending: isRoomsPending } = usePublicRoomsQuery();

  const visibleHours = config ? config.hours : undefined;

  const fallbackHours = useMemo(() => {
    const totalFallbackHours = visibleHours ? visibleHours.to - visibleHours.from : 24;
    const minFallBackHour = visibleHours ? visibleHours.from : 0;
    return Array.from({ length: totalFallbackHours }, (_, i) => i + minFallBackHour);
  }, [visibleHours]);

  const [isHeaderLoading, setIsHeaderLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string>('-1');

  const handleSelectDate = useCallback((date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  }, []);

  const value = useMemo(
    () => ({
      isHeaderLoading,
      setIsHeaderLoading,
      totalEvents,
      setTotalEvents,
      selectedDate,
      setSelectedDate: handleSelectDate,
      selectedRoomId,
      setSelectedRoomId,
      visibleRooms,
      visibleHours: config?.hours ?? undefined,
      fallbackHours,
      interval: config?.interval ?? 30,
      configurationError,
      roomError,
      isConfigurationPending,
      isRoomsPending,
    }),
    [
      isHeaderLoading,
      totalEvents,
      selectedDate,
      handleSelectDate,
      selectedRoomId,
      visibleRooms,
      config?.hours,
      config?.interval,
      fallbackHours,
      configurationError,
      roomError,
      isConfigurationPending,
      isRoomsPending,
    ],
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function usePublicCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context) throw new Error('usePublicCalendar must be used within a CalendarProviderPublic.');
  return context;
}
