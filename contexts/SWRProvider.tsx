"use client";

import { ReactNode } from "react";
import { SWRConfig } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={{ fetcher: fetcher }}>{children}</SWRConfig>;
}
