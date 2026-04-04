import React from 'react';
import { LucideTrash2, LucideFilter, LucideX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommandFooterProps {
  onClear: () => void;
  onClose: () => void;
  showClear: boolean;
  showSelectedButton: boolean;
}

/**
 * Footer section with action buttons for the dropdown
 */
export const CommandFooter = ({ onClear, onClose, showClear, showSelectedButton }: CommandFooterProps) => (
  <div className="flex items-center justify-between p-1 bg-accent gap-2 rounded-md">
    {showClear && (
      <Button variant={'outline_destructive'} onClick={onClear} className="flex-1 justify-center cursor-pointer text-xs py-2 dark:bg-input/30">
        <LucideTrash2 />
        Clear
      </Button>
    )}
    {showSelectedButton && (
      <Button
        variant={'outline'}
        onClick={() => {
          console.log('Selected');
        }}
        className="flex-1 justify-center cursor-pointer text-xs py-2"
      >
        <LucideFilter />
        Show Selected
      </Button>
    )}
    <Button variant={'outline'} onClick={onClose} className="flex-1 justify-center cursor-pointer text-xs py-2 ">
      <LucideX />
      Close
    </Button>
  </div>
);
