// components/static-tabs.tsx
import * as React from 'react';
import { cn } from '@/lib/utils'; // Use your existing util if available

/**
 * Root wrapper — purely structural.
 */
export function StaticTabs({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="tabs" className={cn('flex flex-col gap-2', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * List wrapper — mirrors your classes for the tablist container.
 */
export function StaticTabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      // Mirrors your original aria/data attributes for consistency
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aria-invalid:border aria-disabled:bg-transparent',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Trigger — purely visual.
 * Uses 'state' instead of Radix context to drive styles.
 */
export interface TabsTriggerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  state?: 'active' | 'inactive';
  readonly?: boolean;
}

export function StaticTabsTrigger({ className, children, state = 'inactive', disabled, readonly, ...props }: TabsTriggerProps) {
  return (
    <button
      type="button"
      role="tab"
      disabled={disabled}
      data-slot="tabs-trigger"
      data-state={state}
      aria-selected={state === 'active'}
      className={cn(
        // The EXACT original class string
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground disabled:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input disabled:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-75 disabled:text-muted-foreground data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Force pointer-events-none for readonly but keep opacity 100
        readonly && 'pointer-events-none opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
