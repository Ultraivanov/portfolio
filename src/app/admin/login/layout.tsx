import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CMS Login — Dima Ginzburg",
  description: "Internal CMS login page.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/admin/login",
  },
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
