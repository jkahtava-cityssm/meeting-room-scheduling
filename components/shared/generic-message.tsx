import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Info, Terminal } from "lucide-react";

export function GenericInfoMessage({ message, title }: { message: string; title: string }) {
  return (
    <div className="flex flex-1 min-h-0">
      <div className={cn("flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1")}>
        <Alert
          variant="default"
          className="mt-4 items-center has-[>svg]:grid-cols-[calc(var(--spacing)*8)_1fr] [&>svg]:size-6 [&>svg]:text-sky-600"
        >
          <Info />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
