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
}: UseTimePickerProps) {
	// LIMIT MAX AND MIN HOUR TO BETWEEN 0 AND 23
	const verifiedMinHour = Math.max(0, Math.min(23, minHour));
	const verifiedMaxHour = Math.max(0, Math.min(23, maxHour));

	const debounceMinuteTimerRef = React.useRef<NodeJS.Timeout | null>(null);
	const debounceHourTimerRef = React.useRef<NodeJS.Timeout | null>(null);

	const [tempHours, setTempHours] = React.useState<string | null>(null);
	const [tempMinutes, setTempMinutes] = React.useState<string | null>(null);

	//CLEAR TIMERS WHEN UNMOUNTING
	React.useEffect(() => {
		return () => {
			if (debounceMinuteTimerRef.current) clearTimeout(debounceMinuteTimerRef.current);
			if (debounceHourTimerRef.current) clearTimeout(debounceHourTimerRef.current);
		};
	}, []);

	//CREATE ARRAY OF SNAP POINTS BASED ON INTERVAL [0,5,10,...]
	const minuteSnapPoints = React.useMemo(() => {
		const points = [];
		for (let i = 0; i < 60; i += minuteInterval) points.push(i);
		return points;
	}, [minuteInterval]);

	const applyTimeToDate = React.useCallback(
		(hours: number, minutes: number): Date => {
			const newDate = new Date(date);

			//CLAMP HOURS TO ENSURE THEY DONT GO PAST THE MAX AND MIN
			const clampedHours = Math.max(verifiedMinHour, Math.min(verifiedMaxHour, hours));
			let clampedMinutes = minutes;

			//STOP UPDATING IF MAX HOUR LIMIT IS MET, AND PREVENT MINUTES FROM BEING UPDATE
			if (clampedHours === verifiedMaxHour && minutes > 0) {
				clampedMinutes = 0;
			}

			//SET HOURS AND MINUTES, IGNORE SECONDS
			newDate.setHours(clampedHours, clampedMinutes, 0, 0);

			//PREVENT DATE BYPASSING CURRENT DAY WHEN INCREMENTING
			if (newDate.getDate() !== date.getDate()) {
				newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
			}

			return newDate;
		},
		[date, verifiedMinHour, verifiedMaxHour],
	);

	//REDUCE ITERATES THROUGH ARRAY OF INTERVALS, COMPARING CURRENT AND PREVIOUS VALUES
	//PREVIOUS IS THE CURRENT BEST MATCH
	//FIND THE DIFFERENCE BETWEEN THE CURRENT VALUE AND THE ORIGINAL VALUE
	//FIND THE DIFFERENCE BETWEEN THE PREVIOUS VALUE AND THE ORIGINAL VALUE
	// IF CURRENT DIF < PREVIOUS DIF, THEN CURRENT IS CLOSER ELSE PREVIOUS IS CLOSER
	//IT CHECKS EVERY ELEMENT IN THE ARRAY REGARDLESS OF IF IT FOUND THE BEST ONE YET.
	const getClosestSnap = (num: number) => {
		return minuteSnapPoints.reduce((prev, curr) => {
			return Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev;
		});
	};

	const display = React.useMemo(() => {
		const hours = date.getHours();
		//IF 24 PAD WITH ZEROS, IF 12 HOUR, GET REMAINDER USING MODULUS, IF 0 SET TO 12, ELSE PASS REMAINDER PAD WITH ZEROS
		const displayHour = is24HourTime ? hours.toString().padStart(2, "0") : (hours % 12 || 12).toString().padStart(2, "0");

		//WHEN TYPING tempHours AND tempMinutes GET UPDATED
		//ONCE A TIME EXPIRES OR BLUR OCCURS THE VALUES ARE CLAMPED AND NULLIFIED
		//ONCE NULLIFIED IT UPDATES THE ITEM TO SHOW THE CLAMPED HOUR AND MINUTE
		return {
			hour: tempHours ?? displayHour,
			minutes: tempMinutes ?? date.getMinutes().toString().padStart(2, "0"),
			period: (hours >= 12 ? "PM" : "AM") as Period,
		};
	}, [date, is24HourTime, tempHours, tempMinutes]);

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

	const incrementHours = () => {
		const currentHours = date.getHours();
		//PREVENT WRAP AROUND TO NEXT DAY
		if (currentHours + hourInterval <= verifiedMaxHour) {
			setDate(applyTimeToDate(currentHours + hourInterval, date.getMinutes()));
		}
	};

	const decrementHours = () => {
		const currentHours = date.getHours();
		//PREVENT WRAP AROUND TO PREVIOUS DAY
		if (currentHours - hourInterval >= verifiedMinHour) {
			setDate(applyTimeToDate(currentHours - hourInterval, date.getMinutes()));
		}
	};

	//GET CURRENT MINUTE, FIND SNAP POINT, GET INDEX, INCREMENT OR MOVE TO INDEX 0
	const incrementMinutes = () => {
		const currentMinute = date.getMinutes();
		const snapValue = getClosestSnap(currentMinute);
		const snapPointIndex = minuteSnapPoints.indexOf(snapValue);
		const nextIndex = (snapPointIndex + 1) % minuteSnapPoints.length;

		setDate(applyTimeToDate(date.getHours(), minuteSnapPoints[nextIndex]));
	};
	//GET CURRENT MINUTE, FIND SNAP POINT, GET INDEX,
	//DECREMENT INDEX, ADD LENGTH TO KEEP IN BOUNDS
	//MODULUS AND USE THE REMAINDER AS THE NEW INDEX (2 - 1 + 4) % 4 = 5 % 4 = INDEX 1
	const decrementMinutes = () => {
		const currentMinute = date.getMinutes();
		const snapValue = getClosestSnap(currentMinute);
		const snapPointIndex = minuteSnapPoints.indexOf(snapValue);
		const nextIndex = (snapPointIndex - 1 + minuteSnapPoints.length) % minuteSnapPoints.length;

		setDate(applyTimeToDate(date.getHours(), minuteSnapPoints[nextIndex]));
	};

	//UPDATE THE TIME IF THE PERIOD IS TOGGLED
	const togglePeriod = () => {
		const currentHours = date.getHours();
		const isPM = currentHours >= 12;
		const targetHours = isPM ? currentHours - 12 : currentHours + 12;
		setDate(applyTimeToDate(targetHours, date.getMinutes()));
	};

	const setRawTime = (type: "hour" | "minute", timeValue: string, updateNow: boolean = false, normalize: boolean = true) => {
		const prev = type === "hour" ? (tempHours ?? display.hour) : (tempMinutes ?? display.minutes);

		if (normalize) {
			timeValue = pushDigit(prev, timeValue.slice(-1));
		}

		if (type === "hour") setTempHours(timeValue);
		if (type === "minute") setTempMinutes(timeValue);

		if (debounceHourTimerRef.current && type === "hour") clearTimeout(debounceHourTimerRef.current);
		if (debounceMinuteTimerRef.current && type === "minute") clearTimeout(debounceMinuteTimerRef.current);

		const performUpdate = () => {
			const num = parseInt(timeValue, 10);
			if (isNaN(num)) return;

			if (type === "hour") {
				let hourValue: number;

				if (is24HourTime) {
					hourValue = num;
				} else {
					const currentIsPM = date.getHours() >= 12;
					hourValue = num > 12 ? num : num === 12 ? (currentIsPM ? 12 : 0) : currentIsPM ? num + 12 : num;
				}
				setDate(applyTimeToDate(hourValue, date.getMinutes()));
				setTempHours(null);
			} else {
				setDate(applyTimeToDate(date.getHours(), getClosestSnap(num)));
				setTempMinutes(null);
			}
		};

		if (updateNow) performUpdate();
		else {
			const timer = setTimeout(performUpdate, clampDelay);
			if (type === "hour") debounceHourTimerRef.current = timer;
			if (type === "minute") debounceMinuteTimerRef.current = timer;
		}
	};

	const forceClamp = () => {
		if (tempHours !== null) setRawTime("hour", tempHours, true);
		if (tempMinutes !== null) setRawTime("minute", tempMinutes, true);
	};

	const handleBackspace = (type: "hour" | "minute") => {
		const prev = type === "hour" ? (tempHours ?? display.hour) : (tempMinutes ?? display.minutes);

		const shifted = popDigit(prev);
		setRawTime(type, shifted, false, false);
	};

	return {
		display,
		incrementHours,
		decrementHours,
		incrementMinutes,
		decrementMinutes,
		togglePeriod,
		setRawTime,
		handleBackspace,
		handleBlur: (type: "hour" | "minute", val: string) => setRawTime(type, val, true),
		forceClamp,
	};
}
