"use client";

import { useEffect, useState } from "react";
import styles from "./consent-banner.module.css";

type ConsentState = "unknown" | "granted" | "denied";

export default function ConsentBanner() {
  if (!process.env.NEXT_PUBLIC_GA_ID) {
    return null;
  }
  const [consent, setConsent] = useState<ConsentState>("unknown");

  useEffect(() => {
    const stored = window.localStorage.getItem("analytics-consent");
    if (stored === "granted" || stored === "denied") {
      setConsent(stored);
    }
  }, []);

  if (consent !== "unknown") {
    return null;
  }

  const updateConsent = (value: Exclude<ConsentState, "unknown">) => {
    window.localStorage.setItem("analytics-consent", value);
    setConsent(value);
    window.dispatchEvent(new Event("analytics-consent"));
  };

  return (
    <div className={styles.banner} role="region" aria-label="Cookie consent">
      <div className={styles.text}>
        <p className={styles.title}>Analytics cookies</p>
        <p className={styles.body}>
          I use Google Analytics to understand what people read and what they skip.
          Analytics is off until you accept.
        </p>
        <a className={styles.link} href="/privacy">
          Read the privacy policy
        </a>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={() => updateConsent("denied")}
        >
          Reject
        </button>
        <button
          type="button"
          className={styles.buttonPrimary}
          onClick={() => updateConsent("granted")}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
