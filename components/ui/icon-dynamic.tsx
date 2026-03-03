"use client";

import { memo, useMemo } from "react";
import { cva } from "class-variance-authority";
import { sharedIconBackgrounVariants, sharedIconColorVariants } from "../../lib/theme/colorVariants";
import { TColors } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BadgeColored } from "./badge-colored";
import { Skeleton } from "./skeleton";

//import type { LucideIcon } from "lucide-react";
//import * as Icons from "lucide-react";
export type IconName = keyof typeof dynamicIconImports;

import dynamic from "next/dynamic";
import dynamicIconImports from "lucide-react/dynamicIconImports";

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
  name: keyof typeof dynamicIconImports;
  color?: TColors;
  showBorder?: boolean;
  hideBackground?: boolean;
}

const DynamicIcon = memo(({ name, color = "invisible", hideBackground = true, ...props }: DynamicIconProps) => {
  const iconClasses = IconColors({ color: color });
  const backgroundClasses = BackgroundColors({ background: hideBackground ? "invisible" : color });

  const Icon = useMemo(
    () =>
      dynamic(dynamicIconImports[name], {
        loading: () => (
          <svg
            {...props}
            className={cn("animate-pulse bg-muted rounded-md shrink-0", props.className)}
            width={props.width || 24}
            height={props.height || 24}
          />
        ),
        ssr: false,
      }),
    [name, props],
  );

  if (!Icon) return null;

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
