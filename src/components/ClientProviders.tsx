"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@gravity-ui/uikit";

type ClientProvidersProps = {
  children: ReactNode;
};

export default function ClientProviders({ children }: ClientProvidersProps) {
  return <ThemeProvider theme="dark">{children}</ThemeProvider>;
}
