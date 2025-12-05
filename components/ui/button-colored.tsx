import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { sharedButtonColorHoverVariants, sharedButtonColorVariants } from "../../lib/theme/colorVariants";

const darkInvalidBorderStyles = "dark:aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40";

//const darkInvalidHoverStyles = "dark:aria-invalid:hover:bg-destructive/10";

const ariaInvalidStyles =
  "aria-invalid:text-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aria-invalid:hover:bg-destructive/10 aria-invalid:hover:border-destructive/50 aria-invalid:hover:text-destructive dark:aria-invalid:hover:bg-destructive/10";

const buttonColoredVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-75 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none  focus-visible:ring-[3px] `,
  {
    variants: {
      variant: {
        default: "border",
      },
      color: sharedButtonColorVariants,
      hover: sharedButtonColorHoverVariants,
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      color: "invisible",
      variant: "default",
      size: "default",
    },
  }
);

function ButtonColored({
  className,
  color,
  variant,
  hover,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonColoredVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonColoredVariants({ color, hover: hover ? hover : color, variant: variant, size, className }))}
      {...props}
    />
  );
}

export { ButtonColored, buttonColoredVariants };
