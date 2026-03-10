import React from "react";

export type Period = "AM" | "PM";
export type TimeInterval = 1 | 5 | 10 | 15 | 20 | 30 | 60;

interface UseTimePickerProps {
	date: Date;
	setDate: (date: Date) => void;
	hourInterval?: number;
	minuteInterval?: TimeInterval;
	minHour?: number; // 0-23
	maxHour?: number; // 0-23
}

export function useTimePicker({ date, setDate, hourInterval = 1, minuteInterval = 15, minHour = 0, maxHour = 23 }: UseTimePickerProps) {
	const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

	const minuteSnapPoints = React.useMemo(() => {
		const points = [];
		for (let i = 0; i < 60; i += minuteInterval) points.push(i);
		return points;
	}, [minuteInterval]);

	// --- Core Logic: Clamping ---
	const clampDate = React.useCallback(
		(targetDate: Date): Date => {
			const clamped = new Date(targetDate);
			const hours = clamped.getHours();

			if (hours < minHour) {
				clamped.setHours(minHour, 0, 0, 0);
			} else if (hours > maxHour) {
				clamped.setHours(maxHour, 0, 0, 0);
			} else if (hours === maxHour && clamped.getMinutes() > 0) {
				// Hard stop: if we are at the max hour, minutes must be 00
				clamped.setMinutes(0, 0, 0);
			}
			return clamped;
		},
		[minHour, maxHour],
	);

	const getClosestSnap = (num: number) => {
		return minuteSnapPoints.reduce((prev, curr) => {
			return Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev;
		});
	};

	// --- Handlers ---
	const incrementHours = () => {
		const newDate = new Date(date);
		newDate.setHours(newDate.getHours() + hourInterval);
		setDate(clampDate(newDate));
	};

	const decrementHours = () => {
		const newDate = new Date(date);
		newDate.setHours(newDate.getHours() - hourInterval);
		setDate(clampDate(newDate));
	};

	const incrementMinutes = () => {
		const newDate = new Date(date);
		const current = newDate.getMinutes();
		const idx = minuteSnapPoints.indexOf(current);
		const nextIdx = (idx + 1) % minuteSnapPoints.length;
		newDate.setMinutes(minuteSnapPoints[nextIdx]);
		setDate(clampDate(newDate));
	};

	const decrementMinutes = () => {
		const newDate = new Date(date);
		const current = newDate.getMinutes();
		const idx = minuteSnapPoints.indexOf(current);
		const nextIdx = (idx - 1 + minuteSnapPoints.length) % minuteSnapPoints.length;
		newDate.setMinutes(minuteSnapPoints[nextIdx]);
		setDate(clampDate(newDate));
	};

	const togglePeriod = () => {
		const currentHours = date.getHours();
		const isPM = currentHours >= 12;
		let targetHours = isPM ? currentHours - 12 : currentHours + 12;

		const periodMin = isPM ? 0 : 12;
		const periodMax = isPM ? 11 : 23;
		const allowedMin = Math.max(minHour, periodMin);
		const allowedMax = Math.min(maxHour, periodMax);

		if (allowedMin > allowedMax) return;

		if (targetHours < allowedMin) targetHours = allowedMin;
		if (targetHours > allowedMax) targetHours = allowedMax;

		const newDate = new Date(date);
		newDate.setHours(targetHours);
		setDate(clampDate(newDate));
	};

	// --- Manual Input with Intelligent Clamping ---
	const setRawTime = (type: "h" | "m", val: string, immediate: boolean = false) => {
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

		const performUpdate = () => {
			let num = parseInt(val, 10);
			if (isNaN(num)) return;

			const newDate = new Date(date);
			if (type === "h") {
				let h24 = num;
				const currentIsPM = date.getHours() >= 12;

				// If user enters a 24h value directly (like 17)
				if (num > 12) {
					h24 = num;
				}
				// If user enters 12 in AM, it's 0. If 12 in PM, it's 12.
				else if (num === 12) {
					h24 = currentIsPM ? 12 : 0;
				}
				// Normal 1-11 range, maintain current period
				else {
					h24 = currentIsPM ? num + 12 : num;
				}

				newDate.setHours(h24);
			} else {
				newDate.setMinutes(getClosestSnap(num));
			}
			setDate(clampDate(newDate));
		};

		if (immediate) {
			performUpdate();
		} else {
			debounceTimerRef.current = setTimeout(performUpdate, 2000);
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
