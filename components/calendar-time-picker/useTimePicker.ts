import React from "react";

export type Period = "AM" | "PM";
export type TimeInterval = 1 | 5 | 10 | 15 | 20 | 30 | 45 | 60;

interface UseTimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  hourInterval?: number;
  minuteInterval?: TimeInterval;
  minHour?: number; // 0-23
  maxHour?: number; // 0-23
  clampDelay?: number;
  is24HourTime?: boolean;
  allowMinuteRollover?: boolean;
}

export function useTimePicker({
  date,
  setDate,
  hourInterval = 1,
  minuteInterval = 15,
  minHour = 0,
  maxHour = 23,
  clampDelay = 500,
  is24HourTime = false,
  allowMinuteRollover = true,
}: UseTimePickerProps) {
  //STATIC REF: Always holds the latest date without triggering re-renders
  const dateRef = React.useRef(date);
  React.useEffect(() => {
    dateRef.current = date;
  }, [date]);

  // LIMIT MAX AND MIN HOUR TO BETWEEN 0 AND 23
  const verifiedMinHour = Math.max(0, Math.min(23, minHour));
  const verifiedMaxHour = Math.max(0, Math.min(23, maxHour));

  const debounceMinuteTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const debounceHourTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastInputTimeRef = React.useRef<number>(0);

  const [tempHours, setTempHours] = React.useState<string | null>(null);
  const [tempMinutes, setTempMinutes] = React.useState<string | null>(null);

  //CREATE ARRAY OF SNAP POINTS BASED ON INTERVAL [0,5,10,...]
  const minuteSnapPoints = React.useMemo(() => {
    const points = [];
    for (let i = 0; i < 60; i += minuteInterval) points.push(i);
    return points;
  }, [minuteInterval]);

  //REDUCE ITERATES THROUGH ARRAY OF INTERVALS, COMPARING CURRENT AND PREVIOUS VALUES
  //PREVIOUS IS THE CURRENT BEST MATCH
  //FIND THE DIFFERENCE BETWEEN THE CURRENT VALUE AND THE ORIGINAL VALUE
  //FIND THE DIFFERENCE BETWEEN THE PREVIOUS VALUE AND THE ORIGINAL VALUE
  // IF CURRENT DIF < PREVIOUS DIF, THEN CURRENT IS CLOSER ELSE PREVIOUS IS CLOSER
  //IT CHECKS EVERY ELEMENT IN THE ARRAY REGARDLESS OF IF IT FOUND THE BEST ONE YET.
  const getClosestSnap = React.useCallback(
    (num: number) => {
      return minuteSnapPoints.reduce((prev, curr) => {
        return Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev;
      });
    },
    [minuteSnapPoints],
  );

  const getClampedDate = React.useCallback((baseDate: Date, hours: number, minutes: number): Date => {
    const newDate = new Date(baseDate);

    //const clampedMinutes = minutes; //clampedHours === verifiedMaxHour && minutes > 0 ? 0 : minutes;
    const clampedMinutes = Math.max(0, Math.min(59, minutes));

    newDate.setHours(hours, clampedMinutes, 0, 0);

    if (newDate.getDate() !== baseDate.getDate()) {
      newDate.setFullYear(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    }
    return newDate;
  }, []);

  const updateTimeValue = React.useCallback(
    (type: "hour" | "minute", timeValue: string, updateNow: boolean = false) => {
      if (!updateNow) {
        if (type === "hour") setTempHours(timeValue);
        if (type === "minute") setTempMinutes(timeValue);
      }

      // Clear existing debounced timers
      if (type === "hour" && debounceHourTimerRef.current) {
        clearTimeout(debounceHourTimerRef.current);
        debounceHourTimerRef.current = null;
      }
      if (type === "minute" && debounceMinuteTimerRef.current) {
        clearTimeout(debounceMinuteTimerRef.current);
        debounceMinuteTimerRef.current = null;
      }

      const performUpdate = () => {
        const parsedTimeValue = parseInt(timeValue, 10);
        if (isNaN(parsedTimeValue)) return;

        const currentFullDate = dateRef.current;
        const currentHours = currentFullDate.getHours();
        const currentMinutes = currentFullDate.getMinutes();

        let clampedDate: Date;

        if (type === "hour") {
          let hourValue: number;

          if (parsedTimeValue === 24 || parsedTimeValue === 0) {
            hourValue = parsedTimeValue;
          } else if (is24HourTime) {
            hourValue = parsedTimeValue % 24;
          } else {
            // Handle 12-hour logic: 12 AM is 0, 12 PM is 12
            const currentIsPM = currentHours >= 12;
            const rawHour = parsedTimeValue % 12;

            hourValue = currentIsPM ? rawHour + 12 : rawHour;
          }
          clampedDate = getClampedDate(currentFullDate, hourValue, currentMinutes);
          setTempHours(null);
        } else {
          clampedDate = getClampedDate(currentFullDate, currentHours, getClosestSnap(parsedTimeValue));
          setTempMinutes(null);
        }

        if (clampedDate.getTime() !== currentFullDate.getTime()) {
          setDate(clampedDate);
        }
      };

      if (updateNow) {
        performUpdate();
      } else {
        const timer = setTimeout(performUpdate, clampDelay);
        if (type === "hour") debounceHourTimerRef.current = timer;
        if (type === "minute") debounceMinuteTimerRef.current = timer;
      }
    },
    [is24HourTime, getClampedDate, getClosestSnap, setDate, clampDelay],
  );

  /*
  //THIS DOES CLAMP TO THE INTERVAL BUT MIGHT NOT BE WHAT WE WANT IF INTERVALS ARE SWITCHED
	React.useEffect(() => {
		const currentMinutes = date.getMinutes();
		const snappedMinutes = getClosestSnap(currentMinutes);

		// Only sync if the minutes are off-interval (e.g., 12:13 -> 12:15)
		if (currentMinutes !== snappedMinutes) {
			const syncedDate = new Date(date);
			syncedDate.setMinutes(snappedMinutes, 0, 0);
			setDate(syncedDate);
		}
	}, [date, getClosestSnap, setDate]);
*/

  const display = React.useMemo(() => {
    const hours = date.getHours();
    //IF 24 PAD WITH ZEROS, IF 12 HOUR, GET REMAINDER USING MODULUS, IF 0 SET TO 12, ELSE PASS REMAINDER PAD WITH ZEROS
    const displayHour = is24HourTime
      ? hours.toString().padStart(2, "0")
      : (hours % 12 || 12).toString().padStart(2, "0");

    //WHEN TYPING tempHours AND tempMinutes GET UPDATED
    //ONCE A TIME EXPIRES OR BLUR OCCURS THE VALUES ARE CLAMPED AND NULLIFIED
    //ONCE NULLIFIED IT UPDATES THE ITEM TO SHOW THE CLAMPED HOUR AND MINUTE
    return {
      hour: tempHours ?? displayHour,
      minutes: tempMinutes ?? date.getMinutes().toString().padStart(2, "0"),
      period: (hours >= 12 ? "PM" : "AM") as Period,
    };
  }, [date, is24HourTime, tempHours, tempMinutes]);

  const isOutsideBounds = React.useMemo(() => {
    const h = date.getHours();
    return h < verifiedMinHour || h > verifiedMaxHour;
  }, [date, verifiedMinHour, verifiedMaxHour]);

  const pushDigit = React.useCallback((prev: string, next: string) => {
    //CHECKS IF THE NEXT VALUE IS A DIGIT, OTHERWISE IT IGNORES THE KEY
    if (!/^\d$/.test(next)) return prev;
    //CONCATENATE THE OLD AND NEW STRING, REMOVE ANYTHING PAST 2 CHARACTERS THEN PAD
    return (prev + next).slice(-2).padStart(2, "0");
  }, []);

  //REMOVE THE CLOSEST VALUE AND PAD A ZERO
  const popDigit = React.useCallback((prev: string) => {
    return ("0" + prev).slice(0, 2);
  }, []);

  const incrementHours = React.useCallback(() => {
    const currentDate = dateRef.current;
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();
    //PREVENT WRAP AROUND TO NEXT DAY
    if (currentHours + hourInterval <= 23) {
      setDate(getClampedDate(currentDate, currentHours + hourInterval, currentMinutes));
    }
  }, [hourInterval, getClampedDate, setDate]);

  const decrementHours = React.useCallback(() => {
    const currentDate = dateRef.current;
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();
    //PREVENT WRAP AROUND TO PREVIOUS DAY
    if (currentHours - hourInterval >= 0) {
      setDate(getClampedDate(currentDate, currentHours - hourInterval, currentMinutes));
    }
  }, [getClampedDate, hourInterval, setDate]);

  //GET CURRENT MINUTE, FIND SNAP POINT, GET INDEX, INCREMENT OR MOVE TO INDEX 0
  const incrementMinutes = React.useCallback(() => {
    const currentDate = dateRef.current;
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();

    const snapValue = getClosestSnap(currentMinutes);
    const snapPointIndex = minuteSnapPoints.indexOf(snapValue);

    const isLastSnapPoint = snapPointIndex === minuteSnapPoints.length - 1;

    if (snapPointIndex < minuteSnapPoints.length - 1) {
      const nextMinutes = minuteSnapPoints[snapPointIndex + 1];
      setDate(getClampedDate(currentDate, currentHours, nextMinutes));
    } else if (allowMinuteRollover && currentHours < verifiedMaxHour) {
      setDate(getClampedDate(currentDate, currentHours + 1, minuteSnapPoints[0]));
    }
  }, [allowMinuteRollover, getClampedDate, getClosestSnap, minuteSnapPoints, setDate, verifiedMaxHour]);
  //GET CURRENT MINUTE, FIND SNAP POINT, GET INDEX,
  //DECREMENT INDEX, ADD LENGTH TO KEEP IN BOUNDS
  //MODULUS AND USE THE REMAINDER AS THE NEW INDEX (2 - 1 + 4) % 4 = 5 % 4 = INDEX 1
  const decrementMinutes = React.useCallback(() => {
    const currentDate = dateRef.current;
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();

    const snapValue = getClosestSnap(currentMinutes);
    const snapPointIndex = minuteSnapPoints.indexOf(snapValue);
    const isFirstSnapPoint = snapPointIndex === 0;

    if (snapPointIndex > 0) {
      const prevMinutes = minuteSnapPoints[snapPointIndex - 1];
      setDate(getClampedDate(currentDate, currentHours, prevMinutes));
    } else if (allowMinuteRollover && currentHours > verifiedMinHour) {
      const lastMinuteIndex = minuteSnapPoints.length - 1;
      setDate(getClampedDate(currentDate, currentHours - 1, minuteSnapPoints[lastMinuteIndex]));
    }
  }, [allowMinuteRollover, getClampedDate, getClosestSnap, minuteSnapPoints, setDate, verifiedMinHour]);

  //UPDATE THE TIME IF THE PERIOD IS TOGGLED
  const togglePeriod = React.useCallback(() => {
    const currentDate = dateRef.current;
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();

    const isPM = currentHours >= 12;
    const targetHours = isPM ? currentHours - 12 : currentHours + 12;
    setDate(getClampedDate(currentDate, targetHours, currentMinutes));
  }, [getClampedDate, setDate]);

  const handleBackspace = React.useCallback(
    (type: "hour" | "minute") => {
      const prev = type === "hour" ? (tempHours ?? display.hour) : (tempMinutes ?? display.minutes);

      const shifted = popDigit(prev);
      updateTimeValue(type, shifted, false);
    },
    [display.hour, display.minutes, popDigit, tempHours, tempMinutes, updateTimeValue],
  );

  const handleManualInput = React.useCallback(
    (type: "hour" | "minute", char: string) => {
      const now = Date.now();
      const isFreshInput = now - lastInputTimeRef.current > clampDelay;
      lastInputTimeRef.current = now;

      const currentDate = dateRef.current;
      const currentHours = currentDate.getHours();
      const currentMinutes = currentDate.getMinutes();

      const calculateHour = is24HourTime ? currentHours : currentHours % 12 || 12;

      const currentValue = type === "hour" ? calculateHour : currentMinutes;

      const prevValue = isFreshInput
        ? "00"
        : ((type === "hour" ? tempHours : tempMinutes) ?? currentValue.toString().padStart(2, "0"));
      const nextValue = pushDigit(prevValue, char.slice(-1));

      updateTimeValue(type, nextValue, false);
    },
    [clampDelay, is24HourTime, pushDigit, tempHours, tempMinutes, updateTimeValue],
  );

  //CLEAR TIMERS WHEN UNMOUNTING
  React.useEffect(() => {
    return () => {
      if (debounceMinuteTimerRef.current) clearTimeout(debounceMinuteTimerRef.current);
      if (debounceHourTimerRef.current) clearTimeout(debounceHourTimerRef.current);
    };
  }, []);

  const handleBlur = React.useCallback(
    (type: "hour" | "minute", val: string) => {
      window.requestAnimationFrame(() => updateTimeValue(type, val, true));
    },
    [updateTimeValue],
  );

  const forceClamp = React.useCallback(() => {
    if (tempHours !== null) updateTimeValue("hour", tempHours, true);
    if (tempMinutes !== null) updateTimeValue("minute", tempMinutes, true);
  }, [tempHours, tempMinutes, updateTimeValue]);

  return {
    display,
    isOutsideBounds,
    incrementHours,
    decrementHours,
    incrementMinutes,
    decrementMinutes,
    togglePeriod,
    handleManualInput,
    handleBackspace,
    handleBlur,
    forceClamp,
  };
}
