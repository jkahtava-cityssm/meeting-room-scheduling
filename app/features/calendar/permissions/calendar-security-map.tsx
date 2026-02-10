import { createContext, useContext, useMemo } from "react";

export function SecurityAdapter({
  provider: SecurityProvider,
  useHook,
  session,
  children,
}: {
  provider: any;
  useHook: any;
  session: any;
  children: React.ReactNode;
}) {
  return (
    <SecurityProvider session={session}>
      <SecurityMapping useHook={useHook}>{children}</SecurityMapping>
    </SecurityProvider>
  );
}

function SecurityMapping({ useHook, children }: { useHook: any; children: React.ReactNode }) {
  const { can, isVerifying } = useHook();

  // Map the specific context to the unified context
  const value = useMemo(() => ({ can, isVerifying }), [can, isVerifying]);

  return <CalendarSecurityContext.Provider value={value}>{children}</CalendarSecurityContext.Provider>;
}

export type CalendarSecurityValue = {
  can: (key: string) => boolean;
  isVerifying: boolean;
  // Add other shared needs here
};

const CalendarSecurityContext = createContext<CalendarSecurityValue | null>(null);

export const useCalendarSecurity = () => {
  const ctx = useContext(CalendarSecurityContext);
  if (!ctx) throw new Error("useCalendarSecurity must be used within a Security Adapter");
  return ctx;
};
