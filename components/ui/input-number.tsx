import { cn } from "@/lib/utils";
import { Input } from "./input";

export default function InputNumber({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <Input
      type="number"
      className={cn(
        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
        className
      )}
      {...props}
    ></Input>
  );
}
