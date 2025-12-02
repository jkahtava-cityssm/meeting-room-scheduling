"use client";

import { lazy, Suspense, memo } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { cva } from "class-variance-authority";
import { sharedIconBackgrounVariants, sharedIconColorVariants } from "./theme/colorVariants";
import { TColors } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BadgeColored } from "./badge-colored";
import { Skeleton } from "./skeleton";

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
  name: IconName;
  color?: TColors;
  showBorder?: boolean;
  hideBackground?: boolean;
}

// Global cache for lazy-loaded icons
const lazyIconCache: Partial<Record<IconName, React.ComponentType<React.SVGProps<SVGSVGElement>>>> = {};

const DynamicIcon = memo(({ name, color = "invisible", hideBackground = true, ...props }: DynamicIconProps) => {
  const iconClasses = IconColors({ color: color });
  const backgroundClasses = BackgroundColors({ background: hideBackground ? "invisible" : color });

  const importFn = dynamicIconImports[name];

  if (!importFn) {
    return null;
  }

  // Cache the lazy-loaded icon component
  if (!lazyIconCache[name]) {
    lazyIconCache[name] = lazy(importFn);
  }

  const LazyIcon = lazyIconCache[name]!;

  return (
    <Suspense fallback={<Skeleton className="min-w-6 min-h-6" />}>
      {hideBackground ? (
        <LazyIcon {...props} className={cn(iconClasses, props.className)} />
      ) : (
        <BadgeColored color={color} className="h-full aspect-square">
          <LazyIcon {...props} className={cn(iconClasses, props.className)} />
        </BadgeColored>
      )}
    </Suspense>
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
