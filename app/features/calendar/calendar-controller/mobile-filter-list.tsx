'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { TColors } from '@/lib/types';
import { BadgeColored } from '@/components/ui/badge-colored';
import DynamicIcon, { IconName } from '@/components/ui/icon-dynamic';

interface MobileFilterListProps {
  options: {
    label: string;
    value: string;
    icon?: IconName;
    color?: TColors;
  }[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  placeholder?: string;
  selectAllValue?: string;
}

export function MobileFilterList({
  options,
  selectedValues,
  onValueChange,
  placeholder = 'Search...',
  selectAllValue = '-1',
}: MobileFilterListProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleValue = (val: string) => {
    if (val === selectAllValue) {
      // If "Select All" is clicked, clear others or set to all
      onValueChange(selectedValues.includes(selectAllValue) ? [] : [selectAllValue]);
      return;
    }

    const newValues = selectedValues.includes(val)
      ? selectedValues.filter((v) => v !== val)
      : [...selectedValues.filter((v) => v !== selectAllValue), val];

    onValueChange(newValues);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search Header - Sticky */}
      <div className="sticky top-0 z-20 bg-background pb-4 pt-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-muted/50 border-none focus-visible:ring-1"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearchQuery('')}>
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Options List */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
        <div className="space-y-1 pb-20">
          {filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <label
                key={option.value}
                className={cn(
                  'flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer',
                  'active:bg-accent hover:bg-accent/50',
                  isSelected ? 'bg-accent/30' : 'transparent',
                )}
              >
                <div className="flex items-center gap-3">
                  {option.icon && (
                    <BadgeColored color={option.color || 'zinc'} className="p-2 ">
                      <DynamicIcon name={option.icon} className="size-5" />
                    </BadgeColored>
                  )}
                  <span className={cn('text-base font-medium', isSelected && 'text-primary')}>{option.label}</span>
                </div>
                <Checkbox checked={isSelected} onCheckedChange={() => toggleValue(option.value)} className="size-6 rounded-md" />
              </label>
            );
          })}
          {filteredOptions.length === 0 && <div className="py-10 text-center text-muted-foreground">No results found</div>}
        </div>
      </div>
    </div>
  );
}
