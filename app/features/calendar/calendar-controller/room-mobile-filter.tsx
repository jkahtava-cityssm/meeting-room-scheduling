import { IconName } from '@/components/ui/icon-dynamic';
import { MobileFilterList } from './mobile-filter-list';
import { TColors } from '@/lib/types';
import { useRoomsQuery } from '@/lib/services/rooms';
import React from 'react';

export function RoomMobileSelector({ selectedRoomIds, onChange }: { selectedRoomIds: string[]; onChange: (ids: string[]) => void }) {
  const { isPending, data } = useRoomsQuery(false);

  const options = React.useMemo(() => {
    if (!data) return [];
    return data.map((room) => ({
      label: room.name,
      value: String(room.roomId),
      icon: room.icon as IconName,
      color: room.color as TColors,
    }));
  }, [data]);

  if (isPending) return <div className="p-8 text-center">Loading Rooms...</div>;

  return <MobileFilterList options={options} selectedValues={selectedRoomIds} onValueChange={onChange} placeholder="Search for a room..." />;
}
