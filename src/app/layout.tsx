import type { Metadata } from "next";
import { IBM_Plex_Sans, Plus_Jakarta_Sans, Geist_Mono, Roboto } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import Layout from "@/components/layout/Layout";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["300"],
  variable: "--font-geist-mono",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto",
  display: "swap",
});

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
    <html lang="en" className={`${ibmPlexSans.variable} ${plusJakartaSans.variable} ${geistMono.variable} ${roboto.variable}`}>
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
