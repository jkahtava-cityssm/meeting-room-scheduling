"use client";

import { memo, useMemo } from "react";
import { cva } from "class-variance-authority";
import { sharedIconBackgrounVariants, sharedIconColorVariants } from "../../lib/theme/colorVariants";
import { TColors } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BadgeColored } from "./badge-colored";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { DynamicIcon as LucideDynamicIcon } from "lucide-react/dynamic";

export type IconName = keyof typeof dynamicIconImports;

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

  const iconElement = (
    <LucideDynamicIcon
      name={name}
      {...props}
      className={cn(iconClasses, props.className)}
      fallback={() => {
        return (
          <div
            style={{ width: props.width || 24, height: props.height || 24 }}
            className="animate-pulse bg-muted rounded-md"
          />
        );
      }}
    />
  );

  if (!iconElement) return null;

  if (hideBackground) return iconElement;
  return (
    <BadgeColored color={color} className="h-full aspect-square">
      {iconElement}
    </BadgeColored>
  );
});

DynamicIcon.displayName = "DynamicIcon";

export default DynamicIcon;
