import { createContext, useContext, useRef, useState, useCallback, useMemo } from "react";

import { IEvent } from "@/lib/schemas/calendar";
import EventDrawerRefactor from "./event-drawer-root";

export type EventDrawerPayload = { creationDate: Date; event?: IEvent; userId?: string; roomId?: number };

// Shared drawer context to avoid mounting many drawers — mount a single EventDrawer
const SharedDrawerContext = createContext<{
	openEventDrawer: (payload: EventDrawerPayload) => void;
} | null>(null);

export function SharedEventDrawerProvider({ children }: { children: React.ReactNode }) {
	const triggerRef = useRef<HTMLButtonElement | null>(null);

	const [payload, setPayload] = useState<EventDrawerPayload | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	const openEventDrawer = useCallback((payload: EventDrawerPayload) => {
		setPayload(payload);
		setIsOpen(true);
	}, []);

	const ctxValue = useMemo(() => ({ openEventDrawer }), [openEventDrawer]);

	const fallbackDate = useMemo(() => new Date(), []);

	return (
		<SharedDrawerContext.Provider value={ctxValue}>
			{children}
			{/* Offscreen trigger wrapped by the single EventDrawer instance */}

			<EventDrawerRefactor
				creationDate={payload ? payload.creationDate : fallbackDate}
				event={payload?.event}
				userId={payload?.userId}
				roomId={payload?.roomId}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
			>
				{/*<button
					ref={triggerRef}
					aria-hidden
					tabIndex={-1}
					onClick={e => e.stopPropagation()}
				/>*/}
			</EventDrawerRefactor>
		</SharedDrawerContext.Provider>
	);
}

export function useSharedEventDrawer() {
	const ctx = useContext(SharedDrawerContext);
	if (!ctx) throw new Error("useSharedDrawer must be used within SharedEventDrawerProvider");
	return ctx;
}
