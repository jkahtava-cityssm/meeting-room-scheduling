import { GenericSelect } from '@/components/shared/generic-select';

import { IconName } from '@/components/ui/icon-dynamic';
import { TColors } from '@/lib/types';
import { useStatusQuery } from '@/lib/services/status';

export function StatusSelect({
  selectedStatusId,
  includeAllOption = true,
  isDisabled = false,
  dataInvalid = false,
  className = 'min-w-60',
  onStatusChange,
}: {
  selectedStatusId: string;
  includeAllOption: boolean;
  isDisabled?: boolean;
  dataInvalid?: boolean;
  className?: string;
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
      loadingLabel={error ? 'Error: Collecting Status' : 'Collecting Status'}
      onChange={(value) => {
        onStatusChange(value);
      }}
      getId={(status) => status.statusId.toString()}
      getLabel={(status) => status.name}
      getColor={(status) => status.color as TColors}
      getIcon={(status) => status.icon as IconName}
      dataInvalid={dataInvalid}
      className={className}
    />
  );
}
