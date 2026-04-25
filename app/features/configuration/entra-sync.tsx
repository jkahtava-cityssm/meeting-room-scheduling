import { CirclePlay, CircleStop, Loader2, LucidePlay, LucideRefreshCw, Save, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SchedulerConfig } from './use-entra-sync-process';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { sharedTextVariants } from '@/lib/theme/colorVariants';
import { cva } from 'class-variance-authority';

export function SchedulerStatus({
  config,
  loading,
  isRunning,
  onRefresh,
  onStart,
  onStop,
}: {
  config: SchedulerConfig;
  loading: boolean;
  isRunning: boolean;
  onRefresh: () => void;
  onStart: () => void;
  onStop: () => void;
}) {
  const textVariants = cva('', {
    variants: {
      color: sharedTextVariants,
    },
    defaultVariants: {
      color: 'slate',
    },
  });

  const startTimeLabel = config.startTime && config.isRunning ? format(config.startTime, 'PP @ p') : 'Not Started';
  const nextRuntimeLabel = config.nextRuntime && config.isRunning ? format(new Date(config.nextRuntime), 'PP @ p') : 'No Sync';
  const pidLabel = config.pid && config.isRunning ? config.pid : 'No Process';
  const cronLabel = config.schedule ? config.schedule : 'No Schedule';

  return (
    <div className="flex">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-row justify-between items-center min-h-9">
          <div>
            <span className="font-bold ">Scheduler: </span>
            <span className={cn('font-bold', config.isRunning ? textVariants({ color: 'green' }) : textVariants({ color: 'red' }))}>
              {config.isRunning === null ? 'Loading...' : config.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
        <div className="flex flex-row gap-3">
          <div className="flex flex-col">
            <div className="flex flex-col gap-1">
              <span className="text-sm">
                <span className="font-semibold text-foreground">Cron Expression:</span> <span className="italic">{cronLabel}</span>
              </span>
              <span className="text-sm">
                <span className="font-semibold text-foreground">PID:</span> <span className="italic">{pidLabel}</span>
              </span>
              <span className="text-sm">
                <span className="font-semibold text-foreground">Started:</span> <span className="italic">{startTimeLabel}</span>
              </span>
              <span className="text-sm">
                <span className="font-semibold text-foreground">Next Sync:</span> <span className="italic">{nextRuntimeLabel}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="flex flex-col">
          <Button variant={'ghost'} size={'icon'} onClick={onRefresh} disabled={loading}>
            {loading ? <Loader2 className="animate-spin size-6" /> : <LucideRefreshCw className="size-6" />}
          </Button>
          {isRunning ? (
            <Button variant={'ghost'} size={'icon'} onClick={onStop} disabled={loading || !isRunning}>
              {loading ? <Loader2 className="animate-spin size-6" /> : <CircleStop className="size-6 " />}
            </Button>
          ) : (
            <Button variant={'ghost'} size={'icon'} onClick={onStart} disabled={loading || isRunning}>
              {loading ? <Loader2 className="animate-spin size-6" /> : <CirclePlay className="size-6" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CronInput({
  initialCron,
  loading,
  isRunning,
  onUpdate,
  validateCronExpression,
}: {
  initialCron: string;
  loading: boolean;
  isRunning: boolean;
  onUpdate: (cron: string) => Promise<void>;
  validateCronExpression: (cron: string) => boolean;
}) {
  const [minute, setMinute] = useState('0');
  const [hour, setHour] = useState('');
  const [day, setDay] = useState('*');
  const [month, setMonth] = useState('*');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync internal state when initialCron changes (e.g., after a refresh)
  useEffect(() => {
    const parts = initialCron.split(' ');
    if (parts.length >= 5) {
      setMinute(parts[0]);
      setHour(parts[1] === '*' ? '' : parts[1]);
      setDay(parts[2]);
      setMonth(parts[3]);
    }
  }, [initialCron]);

  const handleSave = async () => {
    const cronString = buildCronString(minute, hour, day, month);
    if (!validateCronExpression(cronString)) return;

    setIsUpdating(true);
    await onUpdate(cronString);
    setIsUpdating(false);
  };

  const disabled = loading || isRunning;
  const wasModified = buildCronString(minute, hour, day, month) !== initialCron;

  return (
    <div className="flex flex-col  gap-2 border-t pt-2">
      <div className="grid grid-cols-5 gap-2">
        <div className="flex flex-col items-center gap-1">
          <label className="text-[10px] font-bold uppercase">Minute</label>

          <Select disabled={disabled} value={minute} onValueChange={setMinute}>
            <SelectTrigger className="w-full min-w-9">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>

            <SelectContent>
              {['0', '15', '30', '45'].map((m) => (
                <SelectItem key={m} value={m}>
                  {m.padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-center gap-1">
          <label className="text-[10px] font-bold uppercase">Hour (0-23)</label>

          <CronSelect disabled={disabled} value={hour} onValueChange={setHour} includeAnyOption={false} maxValue={23} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <label className="text-[10px] font-bold  uppercase">Day</label>
          <CronSelect disabled={disabled} value={day} onValueChange={setDay} includeAnyOption={true} minValue={1} maxValue={31} />
        </div>

        <div className="flex flex-col  items-center gap-1">
          <label className="text-[10px] font-bold uppercase">Month</label>
          <CronSelect disabled={disabled} value={month} onValueChange={setMonth} includeAnyOption={true} minValue={1} maxValue={12} />
        </div>
        <div className="flex flex-col justify-center  items-center gap-1">
          {wasModified && (
            <Button variant={'ghost'} size={'icon'} onClick={handleSave} disabled={disabled}>
              {loading ? <Loader2 className="animate-spin size-6" /> : <Save className="size-6" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function buildCronString(minute: string, hour: string, day: string, month: string) {
  const cronString = `${minute || '0'} ${hour || '3'} ${day || '*'} ${month || '*'} *`;

  return `${minute} ${hour} ${day} ${month} *`;
}

function CronSelect({
  value,
  onValueChange,
  disabled,
  includeAnyOption,
  minValue = 0,
  maxValue,
}: {
  value: string;
  onValueChange: (value: string) => void;
  includeAnyOption: boolean;
  minValue?: number;
  maxValue: number;
  disabled?: boolean;
}) {
  const valueList: string[] = [];

  valueList.push(
    ...(includeAnyOption ? ['*'] : []),
    ...Array(maxValue - minValue + 1)
      .keys()
      .map((k) => String(k + minValue)),
  );

  return (
    <Select disabled={disabled} value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full min-w-9">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>

      <SelectContent>
        {valueList.map((value) => {
          return (
            <SelectItem key={value} value={value}>
              {value === '*' ? '*' : value.padStart(2, '0')}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
