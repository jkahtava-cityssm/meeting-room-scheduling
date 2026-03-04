import { CombinedSchema } from "../room-drawer-schema.validator";

import { getDurationText } from "@/lib/helpers";
import { IRoom } from "@/lib/schemas/calendar";

export const getFormDefaults = (): CombinedSchema => {
  return {
    roomId: "0",
    name: "",
    color: "",
    icon: "",
    publicFacing: "false",
    roomCategoryId: "",
    roomProperty: [],
    roomRoles: [],
  } as CombinedSchema;
};

export const mapRoomToSchema = (room: IRoom): CombinedSchema => {
  const SRoomFormDefaults = {
    roomId: String(room.roomId),
    name: String(room.name),
    color: String(room.color),
    icon: String(room.icon),
    publicFacing: room.publicFacing ? "true" : "false",
    roomCategoryId: String(room.roomCategoryId),
    roomProperty: (room.roomProperty ?? []).map((p) => String(p.roomPropertyId)),
    roomRoles: (room.roomRoles ?? []).map((r) => String(r.roleId)),
  };

  return { ...SRoomFormDefaults } as CombinedSchema;
};
