"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeInterval, useTimePicker } from "./use12HourFormat";

const INTERVAL_OPTIONS = ["1", "5", "10", "15", "20", "30", "45", "60"];

export function TimePickerTest() {
	const [date, setDate] = React.useState(new Date(new Date().setHours(10, 0, 0, 0)));

	// Lab Controls State
	const [minuteInterval, setMinuteInterval] = React.useState("15");
	const [minHour, setMinHour] = React.useState(8);
	const [maxHour, setMaxHour] = React.useState(17);

	const { display, incrementHours, decrementHours, incrementMinutes, decrementMinutes, togglePeriod, setRawTime, handleBlur } = useTimePicker({
		date,
		setDate,
		minuteInterval: parseInt(minuteInterval) as TimeInterval,
		minHour,
		maxHour,
	});

	// Local input buffers
	const [tempMins, setTempMins] = React.useState(display.minutes);
	const [tempHours, setTempHours] = React.useState(display.hour12);

	React.useEffect(() => {
		setTempMins(display.minutes);
	}, [display.minutes]);
	React.useEffect(() => {
		setTempHours(display.hour12);
	}, [display.hour12]);

	return (
		<div className="p-8 space-y-8 max-w-md border rounded-xl shadow-xl mx-auto bg-white">
			<div className="space-y-1 text-center">
				<h2 className="text-xl font-bold tracking-tight">Time Picker Lab</h2>
				<div className="flex items-center justify-center gap-2 text-[10px] text-blue-600 font-black uppercase tracking-widest">
					<span>{minHour}:00</span>
					<span className="h-px w-4 bg-blue-200" />
					<span>{maxHour}:00</span>
					<span className="ml-2 px-1.5 py-0.5 bg-blue-50 rounded italic text-blue-400">{minuteInterval}m steps</span>
				</div>
			</div>

			{/* Main Picker UI */}
			<div className="flex items-center justify-center gap-4 p-8 rounded-2xl border border-slate-100 bg-slate-50/50">
				<div className="flex flex-col gap-2">
					<Input
						className="w-20 h-14 text-center text-2xl font-mono focus:ring-2"
						value={tempHours}
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
						onChange={e => {
							setTempHours(e.target.value);
							setRawTime("h", e.target.value);
						}}
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
							setTempMins(e.target.value);
							setRawTime("m", e.target.value);
						}}
						onBlur={e => handleBlur("m", e.target.value)}
					/>
				</div>

				<Button
					variant="secondary"
					className="h-14 px-4 text-lg font-bold w-20 shadow-sm border"
					onClick={togglePeriod}
				>
					{display.period}
				</Button>
			</div>

			{/* Configuration Panel */}
			<div className="space-y-6 border-t pt-6">
				<div className="space-y-2">
					<Label className="text-xs font-bold uppercase text-slate-500">Step Interval</Label>
					<Select
						value={minuteInterval}
						onValueChange={setMinuteInterval}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select interval" />
						</SelectTrigger>
						<SelectContent>
							{INTERVAL_OPTIONS.map(opt => (
								<SelectItem
									key={opt}
									value={opt}
								>
									{opt} Minutes
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label className="text-xs font-bold uppercase text-slate-500">Min Hour</Label>
						<Input
							type="number"
							value={minHour}
							onChange={e => setMinHour(Math.min(Number(e.target.value), maxHour - 1))}
							min={0}
							max={23}
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-xs font-bold uppercase text-slate-500">Max Hour</Label>
						<Input
							type="number"
							value={maxHour}
							onChange={e => setMaxHour(Math.max(Number(e.target.value), minHour + 1))}
							min={0}
							max={23}
						/>
					</div>
				</div>
			</div>

			{/* Debug Footer */}
			<div className="rounded-lg bg-slate-900 p-4 text-slate-400 font-mono text-[10px] space-y-1">
				<div className="grid grid-cols-2 gap-2">
					<span>Mins: {display.minutes}</span>
					<span>H12: {display.hour12}</span>
					<span>H24: {display.hour24}</span>
					<span>Period: {display.period}</span>
				</div>
				<div className="pt-2 border-t border-slate-800 truncate">ISO: {date.toISOString()}</div>
				<div className="pt-2 border-t border-slate-800 truncate">Local: {date.toLocaleString()}</div>
			</div>
		</div>
	);
}
