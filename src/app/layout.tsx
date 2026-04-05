import type { Metadata } from "next";
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
        url: "/og.png",
        width: 1168,
        height: 608,
        alt: "Portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dima Ginzburg — Product Designer",
    description:
      "I turn messy product problems into clear structure, usable flows, and credible interfaces.",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png?v=2",
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
