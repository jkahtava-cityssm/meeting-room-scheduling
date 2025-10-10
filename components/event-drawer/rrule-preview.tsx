import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";

export function RRulePreview({
  localDates,
  totalRules,
  isLoading,
}: {
  localDates: Date[];
  totalRules: number | undefined;
  isLoading: boolean;
}) {
  if (isLoading || localDates.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <Skeleton className="h-9"></Skeleton>
        <Skeleton className="h-60">
          <div className="flex flex-1 justify-center items-center h-60">
            {localDates.length !== 0 && isLoading ? "Generating" : "Invalid Reccurrence Rule"}
          </div>
        </Skeleton>
        <Skeleton className="h-9"></Skeleton>
      </div>
    );
  }

  return (
    <ScrollArea className="h-80" type="always">
      <div className=" min-h-80 max-h-80">
        <div className="flex flex-col gap-2">
          <Table className="min-h-80">
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead className="w-27">Weekday</TableHead>
                <TableHead className="w-20">Month</TableHead>
                <TableHead className="w-11">Day</TableHead>
                <TableHead className="w-13">Year</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {localDates?.map((value, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="w-8">{index + 1}</TableCell>
                    <TableCell className="w-27">{format(value, "EEEE")}</TableCell>
                    <TableCell className="w-20">{format(value, "MMMM")}</TableCell>
                    <TableCell className="w-11">{format(value, "do")}</TableCell>
                    <TableCell className="w-13">{format(value, "yyyy")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>
                  Previewing {localDates?.length} of {totalRules} events in series
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
      <ScrollBar orientation="vertical" forceMount></ScrollBar>
    </ScrollArea>
  );
}
