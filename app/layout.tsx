import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "next-themes";
import { ReactQueryProvider } from "@/contexts/ReactQueryProvider";

export const metadata: Metadata = {
  title: "Board Room Bookings",
  description: "This webpage allows staff of the City of Sault Ste. Marie to view and request shared meeting rooms.",
};

//defaultTheme="system" enableSystem

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          themes={["dark", "light", "theme-zinc-dark", "theme-zinc-light"]}
          defaultTheme="light"
          disableTransitionOnChange
        >
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
