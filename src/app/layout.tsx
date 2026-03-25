import type { Metadata } from "next";
import { Raleway, Roboto } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import Layout from "@/components/layout/Layout";
import "./globals.css";

const bodyFont = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
});

const displayFont = Raleway({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Dima Ginzburg — Product Designer",
  description: "Product design portfolio focused on structure, systems, and outcomes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <ClientProviders>
          <Layout>{children}</Layout>
        </ClientProviders>
      </body>
    </html>
  );
}
