import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { ButtonColored } from "@/components/ui/button-colored";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IEvent, IRoom } from "@/lib/schemas/calendar";
import { MapPin, Save, Send, SendHorizonal, Text } from "lucide-react";

import { TColors } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cva } from "class-variance-authority";
import { sharedColorVariants } from "@/lib/theme/colorVariants";
import { DetailedHTMLProps, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import DynamicIcon, { IconName } from "@/components/ui/icon-dynamic";
import { Checkbox } from "@/components/ui/checkbox";

const RoomCardStyles = cva("", {
  variants: {
    color: sharedColorVariants,
  },
  defaultVariants: {
    color: "blue",
  },
});

interface RoomCardProps extends Omit<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "color"> {
  room: IRoom;
  OnApprove: () => void;
  OnDeny: () => void;
}

export default function RoomCard({ room, OnApprove, OnDeny }: RoomCardProps) {
  return (
    <Card className={cn("w-100 p-2")}>
      <CardHeader>
        <CardTitle className="pb-2 mb-1 border-b">
          <div className="mt-2 flex items-center gap-2">
            <DynamicIcon name={room.icon as IconName} color={room.color as TColors}></DynamicIcon>
            <p>{room.name}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="font-bold">Category:</p>
            <p className="">{room.roomCategory.name}</p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="font-bold">Colour:</p>
            <BadgeColored color={room.color as TColors} className="h-6">
              {room.color}
            </BadgeColored>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="font-bold">Icon:</p>
            <DynamicIcon name={room.icon as IconName} color={room.color as TColors}></DynamicIcon>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="font-bold">Publicly Visible:</p>
            <Checkbox checked={room.publicFacing} disabled />
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="font-bold">Properties:</p>
            {room.roomProperty?.map((property) => {
              if (property.value.toLocaleLowerCase() === "false") return null;
              return <Badge key={property.roomPropertyId}>{property.name}</Badge>;
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-auto">
        <Button onClick={OnApprove} variant="outline">
          <Save className="size-4" />
          Edit Room
        </Button>
        <Button onClick={OnDeny} variant="outline">
          <Send className="size-4" />
          Deny
        </Button>
      </CardFooter>
    </Card>
  );
}
