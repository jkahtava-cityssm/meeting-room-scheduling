import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Terminal } from "lucide-react";

export function GenericError({ error }: { error: Error | null }) {
  return (
    <div className="flex flex-1 min-h-0">
      <div className={cn("flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1 p-4")}>
        <Alert variant="destructive" className="mt-4 ">
          <Terminal className="h-4 w-4" />
          <AlertTitle>{error ? error.name : "Permission Denied"}</AlertTitle>
          <AlertDescription>
            {error ? error.message : "You do not have permission to view this content"}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
