import { CombinedSchema } from "../room-drawer-schema.validator";

import { getDurationText } from "@/lib/helpers";
import { IRoom } from "@/lib/schemas/calendar";
import { FlatRRuleSchema, parseRRule } from "./rrule-utils";

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
		roomProperty: room.roomProperty
			? room.roomProperty.map(property => {
					return String(property.roomPropertyId);
				})
			: [],
		roomRoles: room.roomRoles
			? room.roomRoles.map(role => {
					return String(role.roleId);
				})
			: [],
	};

	return { ...SRoomFormDefaults } as CombinedSchema;
};
