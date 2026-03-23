import { GenericMultiSelect } from "@/components/shared/generic-multiselect";
import { IconName } from "@/components/ui/icon-dynamic";
import { useStatusQuery } from "@/lib/services/status";
import { TColors } from "@/lib/types";

export function StatusMultiSelect({
  selectedStatusKeys,
  onChange,
  excludeStatusKeys,
  className,
  dataInvalid = false,
  isDisabled = false,
  maxCount = 3,
}: {
  selectedStatusKeys: string[];
  onChange: (ids: string[]) => void;
  excludeStatusKeys: string[];
  className?: string;
  dataInvalid?: boolean;
  isDisabled: boolean;
  maxCount?: number;
}) {
  const { isPending, data, error } = useStatusQuery(false);

  return (
    <GenericMultiSelect
      list={data}
      selectedValues={selectedStatusKeys}
      isLoading={isPending}
      isDisabled={isDisabled}
      isError={!!error}
      loadingLabel={error ? "Error: Loading Status" : "Collecting Status"}
      placeholderText="Select Status"
      searchText="Search Status..."
      noResultText="No status found"
      dataInvalid={dataInvalid}
      onValueChange={onChange}
      getId={(status) => status.key.toString()}
      getLabel={(status) => status.name}
      getColor={(status) => status.color as TColors}
      getIcon={(status) => status.icon as IconName}
      className={className}
      hideSelectAll={true}
      hideIcon={false}
      hideClearAll={true}
      hideClearSingle={true}
      hideMoreLabel={true}
    />
  );
}
