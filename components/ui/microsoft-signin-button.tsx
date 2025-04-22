import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[#2F2F2F] border-[1px] microsoft-light shadow-xs hover:bg-[#2F2F2F]/90",
        dark:
          "bg-[#2F2F2F] border-[1px] microsoft-light  shadow-xs hover:bg-[#2F2F2F]/90",
        light:
          "bg-[#FFFFFF] border-[1px] microsoft-dark shadow-xs hover:bg-[#F9F9F9]/90",
      },
      size: {
        default: "h-[41px] gap-[12px] pl-3 pr-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function MicrosoftButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { MicrosoftButton, buttonVariants }
