import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performance Test",
  robots: {
    index: false,
    follow: false,
  },
};

type PerfTestLayoutProps = {
  children: React.ReactNode;
};

export default function PerfTestLayout({ children }: PerfTestLayoutProps) {
  return children;
}
