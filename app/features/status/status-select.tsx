import { GenericSelect } from "@/components/shared/GenericSelect";
import { Button } from "@/components/ui/button";
import { IconName } from "@/components/ui/icon-dynamic";
import { TColors } from "@/lib/types";
import { useStatusQuery } from "@/lib/services/references";
import { CircleX } from "lucide-react";

export function StatusSelect({
  selectedStatusId,
  includeAllOption = true,
  onStatusChange,
}: {
  selectedStatusId: string;
  includeAllOption: boolean;
  onStatusChange: (value: string) => void;
}) {
  const { isPending, data, error } = useStatusQuery(includeAllOption);

  if (error) {
    return (
      <Button variant={"outline"} disabled className="min-w-60">
        <CircleX />
        Error
      </Button>
    );
  }
  return (
    <GenericSelect
      list={data}
      selectedValue={selectedStatusId}
      isLoading={isPending}
      loadingLabel="Collecting Status"
      onChange={(value) => {
        onStatusChange(value);
      }}
      getId={(status) => status.statusId.toString()}
      getLabel={(status) => status.name}
      getColor={(status) => status.color as TColors}
      getIcon={(status) => status.icon as IconName}
      className="min-w-60"
    />
  );
}
