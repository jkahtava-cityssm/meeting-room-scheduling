import { createContext, useContext } from "react";

type BookingContextType = {
  startDate: string;
  endDate: string;
  type: "user" | "status";
  id: string;
};

const BookingContext = createContext<BookingContextType | null>(null);

export const useBookingContext = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookingContext must be used within BookingProvider");
  return ctx;
};

export const BookingProvider = ({ children, value }: { children: React.ReactNode; value: BookingContextType }) => (
  <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
);
