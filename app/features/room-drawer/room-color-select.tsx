import { Button } from '@/components/ui/button';

import { COLOR_OPTIONS } from '@/lib/types';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BadgeColored } from '@/components/ui/badge-colored';
import { cn } from '@/lib/utils';

export function RoomColorSelect({
  selectedColorId,
  includeAllOption = true,
  isDisabled = false,
  dataInvalid = false,
  className = 'min-w-60',
  onColorChange,
}: {
  selectedColorId: string;
  includeAllOption: boolean;
  isDisabled?: boolean;
  dataInvalid?: boolean;
  className?: string;
  onColorChange: (value: string) => void;
}) {
  const colorList = COLOR_OPTIONS.filter(
    (color) => color !== 'disabled' && color !== 'invisible' && color !== 'approved' && color !== 'rejected',
  ).map((color) => {
    return { color: color };
  });

  if (isDisabled) {
    const selectedItem = colorList.find((item) => item.color === selectedColorId);
    return (
      <Button data-invalid={dataInvalid} aria-invalid={dataInvalid} variant={'combobox'} disabled className={cn('min-w-[200px]', className)}>
        {selectedItem && <BadgeColored color={selectedItem.color}>{selectedItem.color}</BadgeColored>}
      </Button>
    );
  }

  return (
    <Select value={selectedColorId} onValueChange={onColorChange}>
      <SelectTrigger aria-invalid={dataInvalid} data-invalid={dataInvalid} className={cn('min-w-[200px]', className)}>
        <SelectValue placeholder={'Select a Room Colour'} />
      </SelectTrigger>

      <SelectContent align="end">
        {colorList.map((item) => (
          <SelectItem key={item.color} value={item.color} className="flex-1">
            <div className="flex items-center gap-2 w-full text-sm">
              <BadgeColored color={item.color}>{item.color}</BadgeColored>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
