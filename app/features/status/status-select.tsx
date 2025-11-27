import { GenericSelect } from "@/components/shared/GenericSelect";
import { IconName } from "@/components/ui/icon-dynamic";
import { TColors } from "@/lib/types";
import { useStatusQuery } from "@/services/references";

export function StatusSelect({
  selectedStatusId,
  includeAllOption = true,
  onStatusChange,
}: {
  selectedStatusId: string;
  includeAllOption: boolean;
  onStatusChange: (value: string) => void;
}) {
  const { isPending, data } = useStatusQuery(includeAllOption);

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
