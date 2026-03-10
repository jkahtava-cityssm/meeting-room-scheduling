"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTimePicker } from "./use12HourFormat";

export function TimePickerTest() {
	const [date, setDate] = React.useState(new Date(new Date().setHours(10, 0, 0, 0)));
	const [tempMins, setTempMins] = React.useState("");

	const { display, incrementHours, decrementHours, incrementMinutes, decrementMinutes, togglePeriod, setRawTime, handleBlur } = useTimePicker({
		date,
		setDate,
		minuteInterval: 15,
		minHour: 9,
		maxHour: 17,
	});

	// Sync internal display to local state for typing fluidity
	React.useEffect(() => {
		setTempMins(display.minutes);
	}, [display.minutes]);

	return (
		<div className="p-8 space-y-6 max-w-md border rounded-xl  shadow-xl mx-auto">
			<div className="space-y-1 text-center">
				<h2 className="text-xl font-bold tracking-tight">Time Picker Lab</h2>
				<p className="text-[10px] text-muted-foreground uppercase font-black">9 AM — 5 PM (15m Steps)</p>
			</div>

			<div className="flex items-center justify-center gap-4 p-8 rounded-2xl border border-slate-100">
				<div className="flex flex-col gap-2">
					<Input
						className="w-20 h-14 text-center text-2xl font-mono focus:ring-2"
						value={display.hour12}
						onKeyDown={e => {
							if (e.key === "ArrowUp") {
								e.preventDefault();
								incrementHours();
							}
							if (e.key === "ArrowDown") {
								e.preventDefault();
								decrementHours();
							}
						}}
						onChange={e => setRawTime("h", e.target.value)}
						onBlur={e => handleBlur("h", e.target.value)}
					/>
				</div>

				<span className="text-3xl font-light text-slate-300">:</span>

				<div className="flex flex-col gap-2">
					<Input
						className="w-20 h-14 text-center text-2xl font-mono focus:ring-2"
						value={tempMins}
						onKeyDown={e => {
							if (e.key === "ArrowUp") {
								e.preventDefault();
								incrementMinutes();
							}
							if (e.key === "ArrowDown") {
								e.preventDefault();
								decrementMinutes();
							}
						}}
						onChange={e => {
							setTempMins(e.target.value); // Local UI update
							setRawTime("m", e.target.value); // Debounced snap
						}}
						onBlur={e => handleBlur("m", e.target.value)} // Immediate snap on exit
					/>
				</div>

				<Button
					variant="secondary"
					className="h-14 px-4 text-lg font-bold w-20 shadow-inner"
					onClick={togglePeriod}
				>
					{display.period}
				</Button>
			</div>

			<div className="rounded-lg bg-slate-900 p-4 text-slate-400 font-mono text-[10px] space-y-1">
				<div className="flex justify-between">
					<span>Actual Minutes:</span>
					<span className="text-green-400">{display.minutes}</span>
				</div>
			</div>
		</div>
	);
}
