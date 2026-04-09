"use client";

import { useEffect, useRef } from "react";
import styles from "./turnstile-widget.module.css";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (container: HTMLElement) => void;
    };
  }
}

type TurnstileWidgetProps = {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
  resetKey: number;
};

export default function TurnstileWidget({
  siteKey,
  onVerify,
  onExpire,
  onError,
  resetKey,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;

    const scriptId = "turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    let cancelled = false;
    const render = () => {
      if (!containerRef.current || !window.turnstile || cancelled) {
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        "expired-callback": onExpire,
        "error-callback": onError,
      });
    };

    const interval = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(interval);
        render();
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (containerRef.current && window.turnstile) {
        window.turnstile.remove(containerRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, onVerify, onExpire, onError, resetKey]);

  return <div ref={containerRef} className={styles.turnstile} />;
}
