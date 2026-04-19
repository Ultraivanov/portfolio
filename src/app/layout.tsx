import type { Metadata } from "next";
import ClientProviders from "@/components/ClientProviders";
import Layout from "@/components/layout/Layout";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  DEFAULT_TWITTER_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Product Designer",
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 900,
        alt: "Portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Product Designer",
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_TWITTER_IMAGE,
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
