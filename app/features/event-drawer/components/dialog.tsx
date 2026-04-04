import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogSave,
} from '@/components/ui/alert-dialog';
import React from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for class merging
import { CircleAlert, CircleCheckIcon, CircleX, Info } from 'lucide-react';

export type DialogVariant = 'warning' | 'error' | 'info' | 'success';

interface EventDialogProps {
  variant: DialogVariant;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  errors?: string[];
  onSave?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showSave?: boolean;
  showCancel?: boolean;
  showConfirm?: boolean;
}

export const EventDialog: React.FC<EventDialogProps> = ({
  variant,
  isOpen,
  onClose,
  title,
  description,
  errors,
  onSave,
  onCancel,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showSave = false,
  showCancel = false,
  showConfirm = false,
}) => {
  const isDestructive = variant === 'error' || variant === 'warning';
  const isInformational = variant === 'info' || variant === 'success';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex flex-row gap-4">
            <div className="shrink-0 pt-1">
              {variant === 'error' && <CircleX size={50} className="text-destructive" />}
              {variant === 'warning' && <CircleAlert size={50} className="text-amber-600" />}
              {variant === 'info' && <Info size={50} className="text-sky-600" />}
              {variant === 'success' && <CircleCheckIcon size={50} className="text-green-600" />}
            </div>
            <div className="flex flex-col gap-1.5">
              <AlertDialogTitle
                className={cn(
                  variant === 'error' && 'text-destructive',
                  variant === 'warning' && 'text-amber-600',
                  variant === 'info' && 'text-sky-600',
                )}
              >
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {errors && errors.length > 0 && (
          <ul className="list-disc pl-6 text-sm text-red-600 my-4">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        )}

        <AlertDialogFooter>
          {showSave && onSave && (
            <AlertDialogSave onClick={onSave} className="sm:mr-auto">
              Save for later
            </AlertDialogSave>
          )}

          {showCancel && <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>}
          {showConfirm && (
            <AlertDialogAction
              onClick={onConfirm}
              className={cn(
                isDestructive &&
                  'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
              )}
            >
              {confirmText}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
