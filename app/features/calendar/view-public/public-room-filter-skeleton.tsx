'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import React from 'react';
import { useRoomLayout } from './use-room-category-filter';

export interface SkeletonRooms {
  roomCategory: { name: string };
  roomId: string;
}

function createCategories(category: string, total: number) {
  return [...Array(total).keys()].map((value, index) => {
    return { roomCategory: { name: category }, roomId: category + '-' + String(index) };
  });
}

export const RoomCategorySkeleton = ({ className }: { className?: string }) => {
  const rooms = [...createCategories('GroupA', 8), ...createCategories('GroupB', 4), ...createCategories('GroupC', 2)];

  const { roomsByCategory, rows } = useRoomLayout(rooms);

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('flex flex-wrap gap-x-2 gap-y-8', className)}>
        {rows.map((row, index) => (
          <React.Fragment key={index}>
            <SkeletonGroup key={index} categories={[row.left]} roomsByCategory={roomsByCategory} />
            <SkeletonGroup categories={row.right} roomsByCategory={roomsByCategory} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const SkeletonGroup = ({ categories, roomsByCategory }: { categories: string[]; roomsByCategory: Record<string, SkeletonRooms[]> }) => (
  <div className="min-w-[180px] flex-1 lg:flex-none">
    <div className="flex flex-col gap-4">
      {categories.map((category) => {
        return (
          <div key={category} className="flex flex-col">
            <Skeleton className="h-7 w-45"></Skeleton>
            <div className="mt-2 space-y-2">
              {roomsByCategory[category]?.map((room) => {
                return (
                  <div key={room.roomId} className="flex items-start gap-3 py-1">
                    <Skeleton className="w-4 h-4"></Skeleton>
                    <Skeleton className="w-45 h-5"></Skeleton>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
