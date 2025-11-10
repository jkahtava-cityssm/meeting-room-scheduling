"use client";

import { lazy, Suspense, memo } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { cva } from "class-variance-authority";
import { sharedIconBackgrounVariants, sharedIconColorVariants } from "./theme/colorVariants";
import { TColors } from "@/lib/types";
import { cn } from "@/lib/utils";

export type IconName = keyof typeof dynamicIconImports;

const IconColors = cva("", {
  variants: {
    color: sharedIconColorVariants,
  },
  defaultVariants: {
    color: "none",
  },
});

const BackgroundColors = cva("", {
  variants: {
    background: sharedIconBackgrounVariants,
  },
  defaultVariants: {
    background: "none",
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

const DynamicIcon = memo(({ name, color = "none", hideBackground = true, ...props }: DynamicIconProps) => {
  const iconClasses = IconColors({ color: color });
  const backgroundClasses = BackgroundColors({ background: hideBackground ? "none" : color });

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
    <Suspense fallback={null}>
      <div
        className={cn(
          backgroundClasses,
          !hideBackground
            ? "px-1.5 py-1.5 rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            : ""
        )}
      >
        <LazyIcon {...props} className={cn(iconClasses)} />
      </div>
    </Suspense>
  );
});

DynamicIcon.displayName = "DynamicIcon";

export default DynamicIcon;
