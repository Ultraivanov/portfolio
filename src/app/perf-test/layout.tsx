import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performance Test — Internal Diagnostics",
  description: "Internal diagnostics page for runtime and web-vitals checks.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/perf-test",
  },
};

export default function PerfTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
