import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import Layout from "@/components/layout/Layout";
import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

const displayFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      <head>
        <script
          async
          src="https://mcp.figma.com/mcp/html-to-design/capture.js"
        />
      </head>
      <body>
        <ClientProviders>
          <Layout>{children}</Layout>
        </ClientProviders>
      </body>
    </html>
  );
}
