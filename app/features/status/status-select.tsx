import { GenericSelect } from "@/components/shared/generic-select";
import { Button } from "@/components/ui/button";
import { IconName } from "@/components/ui/icon-dynamic";
import { TColors } from "@/lib/types";
import { useStatusQuery } from "@/lib/services/status";
import { CircleX } from "lucide-react";

export function StatusSelect({
  selectedStatusId,
  includeAllOption = true,
  isDisabled = false,
  dataInvalid = false,
  onStatusChange,
}: {
  selectedStatusId: string;
  includeAllOption: boolean;
  isDisabled?: boolean;
  dataInvalid?: boolean;
  onStatusChange: (value: string) => void;
}) {
  const { isPending, data, error } = useStatusQuery(includeAllOption);

  return (
    <GenericSelect
      list={data}
      selectedValue={selectedStatusId}
      isLoading={isPending}
      isError={!!error}
      isDisabled={isDisabled}
      loadingLabel={error ? "Error: Collecting Status" : "Collecting Status"}
      onChange={(value) => {
        onStatusChange(value);
      }}
      getId={(status) => status.statusId.toString()}
      getLabel={(status) => status.name}
      getColor={(status) => status.color as TColors}
      getIcon={(status) => status.icon as IconName}
      dataInvalid={dataInvalid}
      className="min-w-60"
    />
  );
}
