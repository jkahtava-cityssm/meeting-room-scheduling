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
}

export function useTimePicker({ date, setDate, hourInterval = 1, minuteInterval = 15, minHour = 0, maxHour = 23 }: UseTimePickerProps) {
	const debounceMinuteTimerRef = React.useRef<NodeJS.Timeout | null>(null);
	const debounceHourTimerRef = React.useRef<NodeJS.Timeout | null>(null);

	const minuteSnapPoints = React.useMemo(() => {
		const points = [];
		for (let i = 0; i < 60; i += minuteInterval) points.push(i);
		return points;
	}, [minuteInterval]);

	// --- Core Logic: Clamping & Date Locking ---
	const applyTimeToDate = React.useCallback(
		(hours: number, minutes: number): Date => {
			const newDate = new Date(date); // Start with existing date

			// 1. Clamp Hours
			const clampedHours = Math.max(minHour, Math.min(maxHour, hours));
			let clampedMinutes = minutes;

			// 2. Hard stop: if we are at the max hour, minutes cannot exceed 0
			if (clampedHours === maxHour && minutes > 0) {
				clampedMinutes = 0;
			}

			// 3. Set time while strictly preserving YMD
			newDate.setHours(clampedHours, clampedMinutes, 0, 0);

			// Final safety check: If JS Date rolled the day, force it back
			if (newDate.getDate() !== date.getDate()) {
				newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
			}

			return newDate;
		},
		[date, minHour, maxHour],
	);

	const getClosestSnap = (num: number) => {
		return minuteSnapPoints.reduce((prev, curr) => {
			return Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev;
		});
	};

	// --- Handlers ---
	const incrementHours = () => {
		const currentHours = date.getHours();
		// Prevent wrap-around to next day
		if (currentHours + hourInterval <= maxHour) {
			setDate(applyTimeToDate(currentHours + hourInterval, date.getMinutes()));
		}
	};

	const decrementHours = () => {
		const currentHours = date.getHours();
		// Prevent wrap-around to previous day
		if (currentHours - hourInterval >= minHour) {
			setDate(applyTimeToDate(currentHours - hourInterval, date.getMinutes()));
		}
	};

	const incrementMinutes = () => {
		const current = date.getMinutes();
		const idx = minuteSnapPoints.indexOf(getClosestSnap(current));
		const nextIdx = (idx + 1) % minuteSnapPoints.length;

		// Only increment if it doesn't push us past the maxHour limit
		setDate(applyTimeToDate(date.getHours(), minuteSnapPoints[nextIdx]));
	};

	const decrementMinutes = () => {
		const current = date.getMinutes();
		const idx = minuteSnapPoints.indexOf(getClosestSnap(current));
		const nextIdx = (idx - 1 + minuteSnapPoints.length) % minuteSnapPoints.length;

		setDate(applyTimeToDate(date.getHours(), minuteSnapPoints[nextIdx]));
	};

	const togglePeriod = () => {
		const currentHours = date.getHours();
		const isPM = currentHours >= 12;
		const targetHours = isPM ? currentHours - 12 : currentHours + 12;
		setDate(applyTimeToDate(targetHours, date.getMinutes()));
	};

	const setRawTime = (type: "h" | "m", val: string, immediate: boolean = false) => {
		if (debounceHourTimerRef.current && type === "h") clearTimeout(debounceHourTimerRef.current);
		if (debounceMinuteTimerRef.current && type === "m") clearTimeout(debounceMinuteTimerRef.current);

		const performUpdate = () => {
			const num = parseInt(val, 10);
			if (isNaN(num)) return;

			if (type === "h") {
				const currentIsPM = date.getHours() >= 12;
				const h24 = num > 12 ? num : num === 12 ? (currentIsPM ? 12 : 0) : currentIsPM ? num + 12 : num;
				setDate(applyTimeToDate(h24, date.getMinutes()));
			} else {
				setDate(applyTimeToDate(date.getHours(), getClosestSnap(num)));
			}
		};

		if (immediate) performUpdate();
		else {
			const timer = setTimeout(performUpdate, 2000);
			if (type === "h") debounceHourTimerRef.current = timer;
			if (type === "m") debounceMinuteTimerRef.current = timer;
		}
	};

	const display = React.useMemo(() => {
		const hours = date.getHours();
		return {
			hour12: (hours % 12 || 12).toString().padStart(2, "0"),
			hour24: hours.toString().padStart(2, "0"),
			minutes: date.getMinutes().toString().padStart(2, "0"),
			period: (hours >= 12 ? "PM" : "AM") as Period,
		};
	}, [date]);

	return {
		display,
		incrementHours,
		decrementHours,
		incrementMinutes,
		decrementMinutes,
		togglePeriod,
		setRawTime,
		handleBlur: (type: "h" | "m", val: string) => setRawTime(type, val, true),
	};
}
