import React from 'react';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommandItem } from '@/components/ui/command';
import DynamicIcon from '../ui/icon-dynamic';
import { BadgeColored } from '../ui/badge-colored';
import { type MultiSelectOption } from './multi-select.types';

interface OptionItemProps {
  option: MultiSelectOption;
  isSelected: boolean;
  onToggle: (value: string) => void;
}

/**
 * Individual option item in the dropdown list
 */
export const OptionItem = React.memo(
  function OptionItem({ option, isSelected, onToggle }: OptionItemProps) {
    return (
      <CommandItem
        key={option.value}
        onSelect={() => onToggle(option.value)}
        value={option.value}
        keywords={[option.label]}
        role="option"
        aria-selected={isSelected}
        aria-disabled={option.disabled}
        aria-label={`${option.label}${isSelected ? ', selected' : ', not selected'}${option.disabled ? ', disabled' : ''}`}
        className={cn('cursor-pointer', option.disabled && 'opacity-50 cursor-not-allowed')}
        disabled={option.disabled}
      >
        <div
          className={cn(
            'flex items-center justify-center text-current transition-none  size-4 shrink-0 rounded-[4px]  border shadow-xs transition-shadow outline-none border-input dark:bg-input/30',
            isSelected && 'border-primary bg-primary dark:bg-primary',
          )}
          aria-hidden="true"
        >
          {isSelected && <CheckIcon className="size-3.5 text-primary-foreground" />}
        </div>
        {option.icon && option.color && (
          <BadgeColored color={option.color} className="h-6 w-6">
            <DynamicIcon hideBackground={true} color={option.color} name={option.icon}></DynamicIcon>
          </BadgeColored>
        )}
        <span className="truncate">{option.label}</span>
      </CommandItem>
    );
  },
  (prev, next) => {
    return (
      prev.isSelected === next.isSelected &&
      prev.option.value === next.option.value &&
      prev.option.disabled === next.option.disabled &&
      prev.option.label === next.option.label
    );
  },
);

OptionItem.displayName = 'OptionItem';
