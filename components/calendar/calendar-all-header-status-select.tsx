import { useCalendar } from "@/contexts/CalendarProvider";

import { TColors } from "@/lib/types";
import { IconColored } from "@/components/ui/icon-colored";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Asterisk, BookKey } from "lucide-react";

import { Skeleton } from "../ui/skeleton";
import { useStatusQuery } from "@/services/references";
import DynamicIcon, { IconName } from "../ui/icon-dynamic";
import { BadgeColored } from "../ui/badge-colored";

export function StatusSelect({
  selectedStatusId,
  onStatusChange,
}: {
  selectedStatusId: string;
  onStatusChange: (value: string) => void;
}) {
  //const { selectedRoomId } = useCalendar();

  const { isPending, data } = useStatusQuery(true);

  if (isPending || !data) {
    return <Skeleton className="flex w-fit items-center justify-between gap-2 shrink-0 h-9 flex-1 md:w-60"></Skeleton>;
  }

  return (
    <Select
      value={selectedStatusId}
      onValueChange={(value) => {
        onStatusChange(value);
      }}
    >
      <SelectTrigger className="flex-1 h-2 min-w-60 w-full ">
        <SelectValue />
      </SelectTrigger>

      <SelectContent align="end">
        {data.map((status) => (
          <SelectItem key={status.statusId} value={status.statusId.toString()} className="flex-1">
            <div className="flex items-center gap-2">
              <BadgeColored color={status.color as TColors} className="w-full text-sm">
                <DynamicIcon
                  hideBackground={true}
                  color={status.color as TColors}
                  name={status.icon as IconName}
                ></DynamicIcon>
                {status.name}
              </BadgeColored>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
