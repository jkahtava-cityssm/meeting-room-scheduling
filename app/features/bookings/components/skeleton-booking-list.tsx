import { cva } from "class-variance-authority";
import { sharedColorVariants, sharedIconBackgrounVariants } from "@/lib/theme/colorVariants";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { CalendarRange, CalendarSync, Clock, Hourglass, MapPin, Text } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { TColors } from "@/lib/types";

export default function SkeletonBookingList() {
  const breakpoints = true
    ? "w-(--public-calendar-sidebar-w-min) sm:w-(--public-calendar-sidebar-w-sm) lg:w-(--public-calendar-sidebar-w-lg) xl:w-(--public-calendar-sidebar-w-xl)"
    : "w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg)";

  return (
    <div className={`flex flex-1 flex-col ${breakpoints}`}>
      <div className=" max-h-[calc(100vh-180px)]  overflow-hidden">
        <div className="relative">
          <div className="flex flex-col gap-6 max-w-screen-2xl pr-4">
            <SectionLayoutSkeleton></SectionLayoutSkeleton>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionLayoutSkeleton() {
  //{format(date, "EEEE, MMMM d, yyyy")
  return (
    <div className="border-b">
      <div className="sticky top-0 bg-accent text-accent p-2  shadow-sm  h-10 z-10" data-date={"formattedDate"}>
        <Skeleton className={"w-60 h-5.5 bg-primary/25"}></Skeleton>
      </div>

      <div className="grid">
        <RoomSectionSkeleton color={"emerald"}></RoomSectionSkeleton>
        <RoomSectionSkeleton color={"blue"}></RoomSectionSkeleton>
        <RoomSectionSkeleton color={"indigo"}></RoomSectionSkeleton>
      </div>
    </div>
  );
}

function RoomSectionSkeleton({ color }: { color: TColors }) {
  const roomTitleVariant = cva("sticky z-5 top-10 p-2  shadow-sm h-10 border-2 rounded-b-sm", {
    variants: {
      color: sharedColorVariants,
    },
    defaultVariants: {
      color: "slate",
    },
  });
  const roomTest = cva("", {
    variants: {
      color: sharedIconBackgrounVariants,
    },
    defaultVariants: {
      color: "slate",
    },
  });

  return (
    <div className="w-full">
      <div className={roomTitleVariant({ color: color })}>
        <Skeleton className={cn("w-60 h-5.5 ", roomTest({ color: color }))}></Skeleton>
      </div>
      <div className="flex flex-wrap gap-4 p-4 ">
        <CardSkeleton></CardSkeleton>
        <CardSkeleton></CardSkeleton>
        <CardSkeleton></CardSkeleton>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card className="w-100 p-2">
      <CardHeader>
        <CardTitle className="flex flex-row w-full justify-between items-center pb-2 mb-1 border-b">
          <Skeleton className="w-50 h-6"></Skeleton>
          <Skeleton className="w-30 h-5"></Skeleton>
        </CardTitle>
        <CardTitle className="flex flex-row w-full justify-between items-center">
          <Skeleton className="w-full h-4"></Skeleton>
        </CardTitle>

        <CardDescription>
          <div className="flex flex-col gap-1">
            <div className="mt-1 flex items-center gap-1">
              <MapPin className="size-5 shrink-0" />
              <Skeleton className="w-50 h-4"></Skeleton>
            </div>

            <div className="flex items-center gap-1">
              <CalendarRange className="size-5 shrink-0" />
              <Skeleton className="w-50 h-4"></Skeleton>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-5 shrink-0" />
              <Skeleton className="w-50 h-4"></Skeleton>
            </div>
            <div className="flex items-center gap-1">
              <Hourglass className="size-5 shrink-0" />
              <Skeleton className="w-50 h-4"></Skeleton>
            </div>
            <div className="flex items-center gap-1">
              <CalendarSync className="size-5 shrink-0" />
              <Skeleton className="w-50 h-4"></Skeleton>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2">
            <Text className="size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-7 ">
            <Skeleton className="w-full h-24"></Skeleton>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-auto">
        <Skeleton color="green" className="h-9 w-full sm:w-1/3"></Skeleton>
        <Skeleton color="red" className="h-9 w-full sm:w-1/3"></Skeleton>
        <Skeleton className="h-9 w-full sm:w-1/3"></Skeleton>
      </CardFooter>
    </Card>
  );
}
