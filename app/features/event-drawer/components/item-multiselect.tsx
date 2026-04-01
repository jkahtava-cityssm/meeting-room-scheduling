import { GenericMultiSelect } from "@/components/shared/generic-multiselect";
import { useItemsQuery } from "@/lib/services/items";

export function ItemMultiSelect({
  selectedItemIds,
  onChange,
  className,
  dataInvalid = false,
  isDisabled = false,
  maxCount = 3,
}: {
  selectedItemIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  dataInvalid?: boolean;
  isDisabled: boolean;
  maxCount?: number;
}) {
  const { isPending, data, error } = useItemsQuery();

  return (
    <GenericMultiSelect
      list={data}
      selectedValues={selectedItemIds}
      isLoading={isPending}
      isDisabled={isDisabled}
      isError={!!error}
      loadingLabel={error ? "Error: Loading Items" : "Collecting Items"}
      placeholderText="Select Items"
      searchText="Search items..."
      noResultText="No items found"
      dataInvalid={dataInvalid}
      onValueChange={onChange}
      getId={(item) => item.itemId.toString()}
      getLabel={(item) => item.name}
      className={className}
      maxCount={maxCount}
      hideSelectAll={true}
    />
  );
}
