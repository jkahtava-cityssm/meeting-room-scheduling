import { CirclePlay, CircleStop, Loader2, LucideRefreshCw, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sharedTextVariants } from '@/lib/theme/colorVariants';
import { cva } from 'class-variance-authority';

export interface SchedulerConfig {
  schedule: string;
  isRunning: boolean;
  pid: number | null;
  startTime: number | null;
  nextRuntime?: string | null;
}

export function EntraSyncConfiguration() {
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState<SchedulerConfig>({
    schedule: '',
    isRunning: false,
    pid: null,
    startTime: null,
    nextRuntime: null,
  });

  const [localSchedule, setLocalSchedule] = useState('');
  const [pendingSchedule, setPendingSchedule] = useState('');

  const isDirty = pendingSchedule !== localSchedule && localSchedule !== '';

  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuration/scheduler');
      const data = await response.json();
      if (data.success) {
        setConfig({
          schedule: data.schedule,
          isRunning: data.isRunning,
          pid: data.pid,
          startTime: data.startTime,
          nextRuntime: data.nextRuntime,
        });

        if (!isDirtyRef.current) {
          setLocalSchedule(data.schedule);
          setPendingSchedule(data.schedule);
        }
      }
    } catch (err) {
      console.error('Failed to refresh scheduler:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const FIVE_MINUTES = 5 * 60 * 1000;
    const interval = setInterval(refreshStatus, FIVE_MINUTES);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const handleStart = async () => {
    setLoading(true);
    await fetch('/api/configuration/scheduler', { method: 'POST' });
    await refreshStatus();
  };

  const handleStop = async () => {
    setLoading(true);

    await fetch('/api/configuration/scheduler', { method: 'DELETE' });
    await refreshStatus();
  };

  const handleUpdateSchedule = async () => {
    if (!validateCronExpression(pendingSchedule)) return;
    setLoading(true);

    const response = await fetch('/api/configuration/scheduler', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule: pendingSchedule }),
    });
    if (response.ok) {
      setLocalSchedule(pendingSchedule);
      await refreshStatus();
    }
  };

  const handleResetSchedule = () => {
    setPendingSchedule(localSchedule);
  };

  const validateCronExpression = (cron: string) => {
    // Basic regex: 5 fields separated by spaces
    const cronRegex =
      /^(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*|\?)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)$/;
    return cronRegex.test(cron.trim());
  };

  return (
    <div className="flex flex-col gap-2">
      <SchedulerStatus
        config={config}
        loading={loading}
        isRunning={config.isRunning}
        isModified={isDirty}
        onRefresh={refreshStatus}
        onStart={handleStart}
        onStop={handleStop}
      ></SchedulerStatus>
      <div className="flex flex-col gap-2">
        <CronInput
          currentSchedule={pendingSchedule}
          onPendingChange={setPendingSchedule}
          onSave={handleUpdateSchedule}
          onReset={handleResetSchedule}
          isModified={isDirty}
          disabled={loading || config.isRunning}
        />
      </div>
    </div>
  );
}

export function SchedulerStatus({
  config,
  loading,
  isRunning,
  isModified,
  onRefresh,
  onStart,
  onStop,
}: {
  config: SchedulerConfig;
  loading: boolean;
  isRunning: boolean;
  isModified: boolean;
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
            <span className="font-bold ">Entra Sync: </span>
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
            <Button variant={'ghost'} size={'icon'} onClick={onStop} disabled={loading}>
              {<CircleStop className="size-6 " />}
            </Button>
          ) : (
            <Button variant={'ghost'} size={'icon'} onClick={onStart} disabled={loading || isModified}>
              {<CirclePlay className="size-6" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CronInput({
  currentSchedule,
  onPendingChange,
  onSave,
  onReset,
  isModified,
  disabled,
}: {
  currentSchedule: string;
  onPendingChange: (val: string) => void;
  onSave: () => void;
  onReset: () => void;
  isModified: boolean;
  disabled: boolean;
}) {
  const [minute, setMinute] = useState('0');
  const [hour, setHour] = useState('3');
  const [day, setDay] = useState('*');
  const [month, setMonth] = useState('*');

  // Sync internal state when initialCron changes (e.g., after a refresh)
  useEffect(() => {
    const parts = currentSchedule.split(' ');
    if (parts.length >= 5) {
      setMinute(parts[0]);
      setHour(parts[1]);
      setDay(parts[2]);
      setMonth(parts[3]);
    }
  }, [currentSchedule]);

  useEffect(() => {
    const current = buildCronString(minute, hour, day, month);
    onPendingChange(current);
  }, [minute, hour, day, month, onPendingChange]);

  return (
    <div className="flex flex-col  gap-2 border-t pt-2">
      <div className="grid grid-cols-5 gap-2">
        <div className="flex flex-col items-center gap-1">
          <label className="text-[10px] font-bold uppercase">Minute</label>

          <Select disabled={disabled} value={minute} onValueChange={setMinute}>
            <SelectTrigger className="w-19">
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
        <div className="flex flex-col justify-end  items-center ">
          <div className="flex flex-row gap-1">
            {isModified && (
              <Button variant={'ghost'} size={'icon'} onClick={onReset} disabled={disabled}>
                {<X className="size-6" />}
              </Button>
            )}
            {isModified && (
              <Button variant={'ghost'} size={'icon'} onClick={onSave} disabled={disabled}>
                {<Save className="size-6" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildCronString(minute: string, hour: string, day: string, month: string) {
  const cronString = `${minute || '0'} ${hour || '3'} ${day || '*'} ${month || '*'} *`;

  return cronString;
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
      <SelectTrigger className="w-19">
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
