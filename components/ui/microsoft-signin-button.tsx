import * as React from "react";

import { cn } from "@/lib/utils";

function MicrosoftButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="button"
      className={cn(
        className,
        "inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-75 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border shadow-xs ",
        "not-italic font-semibold text-[15px] ",
        "h-[41px] gap-3 pl-3 pr-3",
        "bg-[#FFFFFF] text-[##5e5e5e] hover:bg-[#F9F9F9]/90",
        "dark:bg-[#2F2F2F]  dark:text-[FFFFFF]   dark:hover:bg-[#2F2F2F]/90",
      )}
      style={{ fontFamily: "Segoe UI, sans-serif" }}
      {...props}
    />
  );
}

function MicrosoftLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="label"
      className={cn(
        className,
        "inline-flex items-center justify-center whitespace-nowrap transition-all  [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none  aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive  ",
        "not-italic font-semibold text-[15px] ",
        "h-[41px] gap-3",
        "bg-background",
        "text-[##5e5e5e] ",
        " dark:text-[FFFFFF]  ",
        className,
      )}
      style={{ fontFamily: "Segoe UI, sans-serif" }}
      {...props}
    />
  );
}

export { MicrosoftButton, MicrosoftLabel };
