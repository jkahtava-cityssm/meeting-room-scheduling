"use server";

import { IRoom } from "@/lib/schemas/schemas";
import { prisma } from "@/prisma";
import { Room } from "@prisma/client";

const AllRooms: IRoom = {
  roomId: -1,
  name: "All Rooms",
  color: "zinc",
  createdAt: new Date(),
  updatedAt: new Date(),
  icon: "Asterisk",
};

export async function getRooms(): Promise<{ data: IRoom[]; error: string | undefined }> {
  const res = await fetch(`${process.env.NEXTAPP_URL}/api/rooms`, {
    cache: "force-cache",
    next: { tags: ["RoomsUpdated"], revalidate: 30 },
  });
  const data = await res.json();

  if (res.status !== 200) {
    return { data: [], error: data.error };
  }

  return { data: data, error: data.error };
}

export async function getRoomsWithAll() {
  const roomList = await getRooms();
  roomList.data.unshift(AllRooms);
  return roomList;
}
