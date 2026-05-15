'use client';

import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Check, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from './button';

interface ComboBoxItem {
  key: string;
  label: string;
  value: string;
}

export function ComboBox({
  value,
  children,
  list,
  noResultText,
  searchText,
  onSelect,
}: {
  value: string;
  children: React.ReactNode;
  list: ComboBoxItem[];
  noResultText: string;
  searchText: string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={searchText} className="h-9" />
          <CommandList>
            <CommandEmpty>{noResultText}</CommandEmpty>
            <CommandGroup>
              {list?.map((item) => (
                <CommandItem
                  value={item.label}
                  key={item.key}
                  onSelect={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <Check className={cn('ml-auto h-4 w-4', value === item.value ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ComboBoxTrigger({
  value,
  list,
  placeholderText,
  className,
  disabled,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button> & {
  value: string | undefined;
  list: ComboBoxItem[];
  placeholderText: string;
}) {
  const selectedLabel = list?.find((item) => item.value === value)?.label;
  return (
    <Button
      variant="outline"
      role="combobox"
      className={cn('min-w-[200px] justify-between text-sm font-normal', !value && 'text-muted-foreground', className)}
      disabled={disabled}
      {...props}
    >
      <span className="truncate">{selectedLabel || placeholderText}</span>

      <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );
}
