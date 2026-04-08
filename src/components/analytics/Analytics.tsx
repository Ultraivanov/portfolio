"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type ConsentState = "unknown" | "granted" | "denied";

export default function Analytics() {
  const [consent, setConsent] = useState<ConsentState>("unknown");

  useEffect(() => {
    const readConsent = () => {
      const stored = window.localStorage.getItem("analytics-consent");
      if (stored === "granted" || stored === "denied") {
        setConsent(stored);
      } else {
        setConsent("unknown");
      }
    };

    readConsent();
    window.addEventListener("analytics-consent", readConsent);
    return () => window.removeEventListener("analytics-consent", readConsent);
  }, []);

  if (!GA_ID || consent !== "granted") {
    return null;
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
      <Script id="ga-init">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
