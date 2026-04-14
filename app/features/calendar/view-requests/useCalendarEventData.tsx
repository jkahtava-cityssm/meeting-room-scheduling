import { useEffect, useMemo, useState } from 'react';
import { usePrivateCalendarEvents } from '../webworkers/use-calendar-private-events';
import { usePrivateCalendar } from '@/contexts/CalendarProviderPrivate';
import { CalendarAction } from '../webworkers/generic-webworker';
import { TStatusKey } from '@/lib/types';

export function useCalendarEventData(action: CalendarAction, date: Date, userId?: string) {
  const [removingEvents, setRemovingEvents] = useState<Map<number, TStatusKey>>(() => new Map());
  const removingEventIds = useMemo(() => new Set(removingEvents.keys()), [removingEvents]);

  const { visibleHours, selectedRoomIds, selectedStatusKeys, setSelectedStatusKeys, setIsHeaderLoading, setTotalEvents, statusIdLookupByKey } =
    usePrivateCalendar();

  useEffect(() => {
    setSelectedStatusKeys(['PENDING']);
  }, [setSelectedStatusKeys]);

  const { result, isLoading, error } = usePrivateCalendarEvents(
    action,
    date,
    visibleHours,
    userId,
    selectedRoomIds,
    selectedStatusKeys,
    true,
    'booking',
  );

  useEffect(() => {
    if (isLoading) setIsHeaderLoading(true);
    if (result && !isLoading) {
      setIsHeaderLoading(false);
      setTotalEvents(result.totalEvents);
    }
  }, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

  const removingGroupIds = useMemo(() => {
    const ids = new Set<string>();
    result?.data?.requestSections?.forEach((section) => {
      section.sectionGroups.forEach((group) => {
        const allEventsWillBeHidden = group.groupEvents.every((e) => {
          const statusToVerify = removingEvents.get(e.eventId) ?? (e.status.key as TStatusKey);
          return !selectedStatusKeys.includes(statusToVerify);
        });
        if (group.groupEvents.length > 0 && allEventsWillBeHidden) {
          ids.add(group.groupKey);
        }
      });
    });
    return ids;
  }, [result?.data?.requestSections, removingEvents, selectedStatusKeys]);

  const removingSectionIds = useMemo(() => {
    const ids = new Set<string>();
    result?.data?.requestSections?.forEach((section) => {
      if (section.sectionGroups.length === 0) return;
      const allGroupsRemoving = section.sectionGroups.every((group) => removingGroupIds.has(group.groupKey));
      if (allGroupsRemoving) ids.add(section.sectionTitle);
    });
    return ids;
  }, [result?.data?.requestSections, removingGroupIds]);

  // Sync server status with local removing state
  useEffect(() => {
    if (removingEvents.size === 0) return;
    const currentServerStatuses = new Map<number, TStatusKey>();
    result?.data?.requestSections?.forEach((s) =>
      s.sectionGroups.forEach((g) => g.groupEvents.forEach((e) => currentServerStatuses.set(e.eventId, e.status.key as TStatusKey))),
    );
    const nextRemovingEvents = new Map(removingEvents);
    let changed = false;
    removingEvents.forEach((targetStatus, id) => {
      const serverStatus = currentServerStatuses.get(id);
      if (!serverStatus || serverStatus === targetStatus) {
        nextRemovingEvents.delete(id);
        changed = true;
      }
    });
    if (changed) setRemovingEvents(nextRemovingEvents);
  }, [result?.data?.requestSections, removingEvents]);

  return {
    result,
    isLoading,
    error,
    removingEvents,
    setRemovingEvents,
    removingEventIds,
    removingGroupIds,
    removingSectionIds,
    selectedStatusKeys,
    statusIdLookupByKey,
  };
}
