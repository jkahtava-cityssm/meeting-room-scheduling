'use client';

import { PUBLIC_IROOM } from '@/lib/services/public';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import React from 'react';
import { useRoomLayout } from './use-room-category-filter';

export const RoomCategoryLayout = ({
  rooms,
  checkedRooms,
  onToggleRoom,
  className,
}: {
  rooms: PUBLIC_IROOM[];
  checkedRooms: Set<number>;
  onToggleRoom: (id: number) => void;
  className?: string;
}) => {
  const { roomsByCategory, rows } = useRoomLayout(rooms);

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('flex flex-wrap gap-x-2 gap-y-8', className)}>
        {rows.map((row, index) => (
          <React.Fragment key={index}>
            <Group key={index} categories={[row.left]} roomsByCategory={roomsByCategory} checkedRooms={checkedRooms} toggleRoom={onToggleRoom} />
            <Group categories={row.right} roomsByCategory={roomsByCategory} checkedRooms={checkedRooms} toggleRoom={onToggleRoom} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const Group = ({
  categories,
  roomsByCategory,
  checkedRooms,
  toggleRoom,
}: {
  categories: string[];
  roomsByCategory: Record<string, PUBLIC_IROOM[]>;
  checkedRooms: Set<number>;
  toggleRoom: (roomId: number) => void;
}) => (
  <div className="min-w-[180px] flex-1 lg:flex-none">
    <div className="flex flex-col gap-4">
      {categories.map((category) => (
        <GroupHeader key={category} category={category}>
          {roomsByCategory[category]?.map((room) => (
            <GroupRow key={room.roomId} room={room} checkedRooms={checkedRooms} toggleRoom={toggleRoom} />
          ))}
        </GroupHeader>
      ))}
    </div>
  </div>
);

const GroupHeader = ({ category, children }: { category: string; children: React.ReactNode }) => (
  <div className="flex flex-col">
    <Label className="text-lg font-bold">{category}</Label>
    <div className="mt-2 space-y-2">{children}</div>
  </div>
);

const GroupRow = ({ room, checkedRooms, toggleRoom }: { room: PUBLIC_IROOM; checkedRooms: Set<number>; toggleRoom: (roomId: number) => void }) => (
  <div className="flex items-start gap-3 py-1">
    <Checkbox
      id={`room-${room.roomId}`}
      checked={checkedRooms.has(room.roomId)}
      onCheckedChange={() => toggleRoom(room.roomId)}
      className="mt-0.5 shrink-0"
    />
    <Label htmlFor={`room-${room.roomId}`} className="text-sm font-medium leading-tight cursor-pointer wrap-break-word">
      {room.name}
    </Label>
  </div>
);
