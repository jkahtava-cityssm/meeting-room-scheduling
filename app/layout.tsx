import type { Metadata } from "next";
import "./globals.css";
import SWRProvider from "@/contexts/SWRProvider";
import { ThemeProvider } from "next-themes";

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
          <SWRProvider>{children}</SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
