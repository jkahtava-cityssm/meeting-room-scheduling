import type { TColors, TVisibleHours } from "@/calendar/types";
import type { IEvent, IRoom } from "@/calendar/interfaces";

import { getVisibleHours } from "./helpers";
import { isSameDay } from "date-fns";

// ================================== //
