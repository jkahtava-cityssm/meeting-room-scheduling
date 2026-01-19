"use client";

import type { LucideIcon } from "lucide-react";
import { memo } from "react";
import { cva } from "class-variance-authority";
import { sharedIconBackgrounVariants, sharedIconColorVariants } from "../../lib/theme/colorVariants";
import { TColors } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BadgeColored } from "./badge-colored";
import { Skeleton } from "./skeleton";

import * as Icons from "lucide-react";
export type IconName = keyof typeof Icons;

const IconColors = cva("", {
  variants: {
    color: sharedIconColorVariants,
  },
  defaultVariants: {
    color: "invisible",
  },
});

const BackgroundColors = cva("", {
  variants: {
    background: sharedIconBackgrounVariants,
  },
  defaultVariants: {
    background: "invisible",
  },
});

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  color?: TColors;
  showBorder?: boolean;
  hideBackground?: boolean;
}

const DynamicIcon = memo(({ name, color = "invisible", hideBackground = true, ...props }: DynamicIconProps) => {
  const iconClasses = IconColors({ color: color });
  const backgroundClasses = BackgroundColors({ background: hideBackground ? "invisible" : color });

  const Icon = Icons[name as keyof typeof Icons] as LucideIcon;

  if (!Icon) return null;

  //<Skeleton className="min-w-6 min-h-6" />
  return hideBackground ? (
    <Icon {...props} className={cn(iconClasses, props.className)} />
  ) : (
    <BadgeColored color={color} className="h-full aspect-square">
      <Icon {...props} className={cn(iconClasses, props.className)} />
    </BadgeColored>
  );
});

DynamicIcon.displayName = "DynamicIcon";

export default DynamicIcon;

/*
        <div
          className={cn(
            backgroundClasses,
            !hideBackground
              ? "px-1.5 py-1.5 rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              : "",
            "inline-flex items-center justify-center"
          )}
        >     
            <LazyIcon {...props} className={cn(iconClasses, props.className)} />
        </div>
*/
