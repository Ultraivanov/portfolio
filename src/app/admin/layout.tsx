import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CMS — Dima Ginzburg",
  description: "Internal content management area.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/admin",
  },
};

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return children;
}
