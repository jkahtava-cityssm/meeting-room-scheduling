import type { Metadata } from "next";
import "./globals.css";
import SWRProvider from "@/contexts/SWRProvider";

export const metadata: Metadata = {
  title: "Board Room Bookings",
  description: "This webpage allows staff of the City of Sault Ste. Marie to view and request shared meeting rooms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
