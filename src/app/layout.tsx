import type { Metadata } from "next";
import { cookies } from "next/headers";
import ClientProviders from "@/components/ClientProviders";
import Layout from "@/components/layout/Layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dima Ginzburg — Product Designer",
  description:
    "I turn messy product problems into clear structure, usable flows, and credible interfaces.",
  metadataBase: new URL("https://ginzburg.work"),
  openGraph: {
    title: "Dima Ginzburg — Product Designer",
    description:
      "I turn messy product problems into clear structure, usable flows, and credible interfaces.",
    url: "https://ginzburg.work",
    siteName: "Dima Ginzburg",
    type: "website",
    images: [
      {
        url: "https://ginzburg.work/og-whatsapp.png",
        width: 1200,
        height: 900,
        alt: "Portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dima Ginzburg — Product Designer",
    description:
      "I turn messy product problems into clear structure, usable flows, and credible interfaces.",
    images: [
      {
        url: "https://ginzburg.work/og.png",
        width: 1200,
        height: 630,
        alt: "Portfolio preview",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon-dg.svg?v=4", type: "image/svg+xml" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png?v=4",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === "development" && (
          <script
            async
            src="https://mcp.figma.com/mcp/html-to-design/capture.js"
          />
        )}
      </head>
      <body>
        <ClientProviders>
          <Layout>{children}</Layout>
        </ClientProviders>
      </body>
    </html>
  );
}
