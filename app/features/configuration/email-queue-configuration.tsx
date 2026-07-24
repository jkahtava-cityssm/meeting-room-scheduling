import { CirclePlay, CircleStop, Loader2, LucideRefreshCw, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sharedTextVariants } from '@/lib/theme/colorVariants';
import { cva } from 'class-variance-authority';
import { fetchDELETE, fetchGET, fetchPATCH, fetchPOST } from '@/lib/fetch-client';

export interface SchedulerConfig {
  schedule: string;
  isRunning: boolean;
  pid: number | null;
  startTime: number | null;
  nextRuntime?: string | null;
}

type SchedulerStatusResponse = {
  success: boolean;
  schedule?: string;
  isRunning?: boolean;
  pid?: number | null;
  startTime?: number | null;
  nextRuntime?: string | null;
  marker?: string | null;
  status?: string;
  message?: string;
  error?: string;
};

export function EmailQueueConfiguration() {
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
      // Updated endpoint path to represent the email queue resource
      const response = await fetchGET<SchedulerStatusResponse>('/api/configuration/email-queue');
      if (response.success) {
        setConfig({
          schedule: response.data?.schedule ?? '',
          isRunning: response.data?.isRunning ?? false,
          pid: response.data?.pid ?? null,
          startTime: response.data?.startTime ?? null,
          nextRuntime: response.data?.nextRuntime ?? null,
        });

        if (!isDirtyRef.current) {
          setLocalSchedule(response.data?.schedule ?? '');
          setPendingSchedule(response.data?.schedule ?? '');
        }
      }
    } catch (err) {
      console.error('Failed to refresh email queue scheduler:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const ONE_MINUTE = 60 * 1000; // Faster interval check for a high-frequency queue
    const interval = setInterval(refreshStatus, ONE_MINUTE);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const handleStart = async () => {
    setLoading(true);
    await fetchPOST<SchedulerStatusResponse>('/api/configuration/email-queue', {});
    await refreshStatus();
  };

  const handleStop = async () => {
    setLoading(true);
    await fetchDELETE<SchedulerStatusResponse>('/api/configuration/email-queue');
    await refreshStatus();
  };

  const handleUpdateSchedule = async () => {
    if (!validateCronExpression(pendingSchedule)) return;
    setLoading(true);

    const response = await fetchPATCH<SchedulerStatusResponse>('/api/configuration/email-queue', { schedule: pendingSchedule });
    if (response.success) {
      setLocalSchedule(pendingSchedule);
      await refreshStatus();
    }
  };

  const handleResetSchedule = () => {
    setPendingSchedule(localSchedule);
  };

  const validateCronExpression = (cron: string) => {
    // Adjusted regex to accommodate a 6-field standard (including seconds prefix)
    const segments = cron.trim().split(/\s+/);
    return segments.length === 6;
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
        onSave={handleUpdateSchedule}
        onReset={handleResetSchedule}
      />
      <div className="flex flex-col gap-2">
        <CronInput currentSchedule={pendingSchedule} onPendingChange={setPendingSchedule} disabled={loading || config.isRunning} />
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
  onSave,
  onReset,
}: {
  config: SchedulerConfig;
  loading: boolean;
  isRunning: boolean;
  isModified: boolean;
  onRefresh: () => void;
  onStart: () => void;
  onStop: () => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const textVariants = cva('', {
    variants: {
      color: sharedTextVariants,
    },
    defaultVariants: {
      color: 'slate',
    },
  });

  const startTimeLabel = config.startTime && config.isRunning ? format(config.startTime, 'PP @ pp') : 'Not Started';
  const nextRuntimeLabel = config.nextRuntime && config.isRunning ? format(new Date(config.nextRuntime), 'PP @ pp') : 'No Sync';
  const pidLabel = config.pid && config.isRunning ? config.pid : 'No Process';
  const cronLabel = config.schedule ? config.schedule : 'No Schedule';

  return (
    <div className="flex">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-row justify-between items-center min-h-9">
          <div>
            <span className="font-bold">Email Queue: </span>
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
                <span className="font-semibold text-foreground">Next Run:</span> <span className="italic">{nextRuntimeLabel}</span>
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
          {isModified ? (
            <div className="flex flex-col">
              <Button variant={'ghost'} size={'icon'} onClick={onSave} disabled={loading || isRunning}>
                <Save className="size-6" />
              </Button>
              <Button variant={'ghost'} size={'icon'} onClick={onReset}>
                <X className="size-6" />
              </Button>
            </div>
          ) : isRunning ? (
            <Button variant={'ghost'} size={'icon'} onClick={onStop} disabled={loading}>
              <CircleStop className="size-6" />
            </Button>
          ) : (
            <Button variant={'ghost'} size={'icon'} onClick={onStart} disabled={loading}>
              <CirclePlay className="size-6" />
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
  disabled,
}: {
  currentSchedule: string;
  onPendingChange: (val: string) => void;
  disabled: boolean;
}) {
  const [second, setSecond] = useState('*/30');
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [day, setDay] = useState('*');
  const [month, setMonth] = useState('*');

  // Parse a 6-segment cron layout string back into single state blocks
  useEffect(() => {
    if (!currentSchedule) return;
    const parts = currentSchedule.split(' ');
    if (parts.length >= 6) {
      setSecond(parts[0]);
      setMinute(parts[1]);
      setHour(parts[2]);
      setDay(parts[3]);
      setMonth(parts[4]);
    }
  }, [currentSchedule]);

  useEffect(() => {
    const current = buildCronString(second, minute, hour, day, month);
    onPendingChange(current);
  }, [second, minute, hour, day, month, onPendingChange]);

  return (
    <div className="flex flex-col gap-2 border-t pt-2">
      <div className="grid grid-cols-5 gap-2">
        {/* Added Seconds Step Options for sub-minute polling intervals */}
        <div className="flex flex-col items-center gap-1">
          <label className="text-[10px] font-bold uppercase">Seconds</label>
          <Select disabled={disabled} value={second} onValueChange={setSecond}>
            <SelectTrigger className="w-19">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">00</SelectItem>
              <SelectItem value="*/30">*/30</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-center gap-1">
          <label className="text-[10px] font-bold uppercase">Minute</label>
          <Select disabled={disabled} value={minute} onValueChange={setMinute}>
            <SelectTrigger className="w-19">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="*">*</SelectItem>
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
          <CronSelect disabled={disabled} value={hour} onValueChange={setHour} includeAnyOption={true} maxValue={23} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <label className="text-[10px] font-bold uppercase">Day</label>
          <CronSelect disabled={disabled} value={day} onValueChange={setDay} includeAnyOption={true} minValue={1} maxValue={31} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <label className="text-[10px] font-bold uppercase">Month</label>
          <CronSelect disabled={disabled} value={month} onValueChange={setMonth} includeAnyOption={true} minValue={1} maxValue={12} />
        </div>
      </div>
    </div>
  );
}

function buildCronString(second: string, minute: string, hour: string, day: string, month: string) {
  // Evaluates to: [second] [minute] [hour] [day] [month] [day_of_week]
  return `${second || '*/30'} ${minute || '*'} ${hour || '*'} ${day || '*'} ${month || '*'} *`;
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
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        {valueList.map((val) => (
          <SelectItem key={val} value={val}>
            {val === '*' ? '*' : val.padStart(2, '0')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
