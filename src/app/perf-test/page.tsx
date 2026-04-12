"use client";

import { useEffect, useState } from "react";
import styles from "./perf-test.module.css";

type TimingMetrics = {
  // Navigation timing
  dns: number;
  tcp: number;
  ssl: number;
  ttfb: number;
  response: number;
  domInteractive: number;
  domComplete: number;
  loadComplete: number;
  // Web Vitals
  lcp?: number;
  fcp?: number;
  cls?: number;
  fid?: number;
  // Environment
  userAgent: string;
  isTelegram: boolean;
  timestamp: string;
};

export default function PerfTestPage() {
  const [metrics, setMetrics] = useState<TimingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const collectMetrics = () => {
      try {
        // Check if we're in Telegram
        const ua = navigator.userAgent;
        const isTelegram = /Telegram|WebView/.test(ua) || 
                          !!(window as unknown as { TelegramWebviewProxy?: unknown }).TelegramWebviewProxy;

        // Navigation Timing
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        
        if (!nav) {
          // Fallback to legacy performance.timing
          const timing = performance.timing;
          const now = performance.now();
          
          setMetrics({
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            ssl: timing.secureConnectionStart ? timing.connectEnd - timing.secureConnectionStart : 0,
            ttfb: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            domInteractive: timing.domInteractive - timing.navigationStart,
            domComplete: timing.domComplete - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart,
            userAgent: ua,
            isTelegram,
            timestamp: new Date().toISOString(),
          });
        } else {
          setMetrics({
            dns: nav.domainLookupEnd - nav.domainLookupStart,
            tcp: nav.connectEnd - nav.connectStart,
            ssl: nav.secureConnectionStart ? nav.connectEnd - nav.secureConnectionStart : 0,
            ttfb: nav.responseStart - nav.startTime,
            response: nav.responseEnd - nav.responseStart,
            domInteractive: nav.domInteractive,
            domComplete: nav.domComplete,
            loadComplete: nav.loadEventEnd,
            userAgent: ua,
            isTelegram,
            timestamp: new Date().toISOString(),
          });
        }

        // Collect Web Vitals
        // LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics((prev) => prev ? { ...prev, lcp: lastEntry.startTime } : null);
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

        // FCP
        const paintEntries = performance.getEntriesByType("paint");
        const fcpEntry = paintEntries.find(e => e.name === "first-contentful-paint");
        if (fcpEntry) {
          setMetrics((prev) => prev ? { ...prev, fcp: fcpEntry.startTime } : null);
        }

        // CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
              clsValue += (entry as PerformanceEntry & { value: number }).value;
            }
          }
          setMetrics((prev) => prev ? { ...prev, cls: clsValue } : null);
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });

        // FID
        const fidObserver = new PerformanceObserver((list) => {
          const firstEntry = list.getEntries()[0] as PerformanceEventTiming | undefined;
          if (firstEntry && firstEntry.processingStart) {
            setMetrics((prev) => prev ? { ...prev, fid: firstEntry.processingStart - firstEntry.startTime } : null);
          }
        });
        fidObserver.observe({ entryTypes: ["first-input"] } as PerformanceObserverInit);

        setLoading(false);

        // Cleanup
        return () => {
          lcpObserver.disconnect();
          clsObserver.disconnect();
          fidObserver.disconnect();
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    // Wait for load to complete
    if (document.readyState === "complete") {
      collectMetrics();
    } else {
      window.addEventListener("load", collectMetrics);
      return () => window.removeEventListener("load", collectMetrics);
    }
  }, []);

  const copyResults = () => {
    if (!metrics) return;
    const text = `
Perf Test Results
=================
Timestamp: ${metrics.timestamp}
Environment: ${metrics.isTelegram ? "Telegram WebView" : "Standard Browser"}
User Agent: ${metrics.userAgent}

Navigation Timing
-----------------
DNS Lookup: ${metrics.dns.toFixed(0)}ms
TCP Connection: ${metrics.tcp.toFixed(0)}ms
SSL Handshake: ${metrics.ssl.toFixed(0)}ms
TTFB: ${metrics.ttfb.toFixed(0)}ms
Response Time: ${metrics.response.toFixed(0)}ms
DOM Interactive: ${metrics.domInteractive.toFixed(0)}ms
DOM Complete: ${metrics.domComplete.toFixed(0)}ms
Load Complete: ${metrics.loadComplete.toFixed(0)}ms

Web Vitals
----------
LCP: ${metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : "pending..."}
FCP: ${metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : "pending..."}
CLS: ${metrics.cls !== undefined ? metrics.cls.toFixed(4) : "pending..."}
FID: ${metrics.fid ? `${metrics.fid.toFixed(0)}ms` : "pending..."}
    `.trim();
    navigator.clipboard.writeText(text);
    alert("Results copied to clipboard!");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Performance Test</h1>
        <div className={styles.loading}>Collecting metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Performance Test</h1>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Performance Test</h1>
        <div className={styles.error}>No metrics available</div>
      </div>
    );
  }

  const getGrade = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return { grade: "A", color: "#16a34a" };
    if (value <= thresholds.poor) return { grade: "B", color: "#ca8a04" };
    return { grade: "C", color: "#dc2626" };
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Performance Test</h1>
      
      {metrics.isTelegram && (
        <div className={styles.badgeTelegram}>
          Telegram WebView Detected
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Environment</h2>
        <div className={styles.row}>
          <span className={styles.label}>Timestamp:</span>
          <span className={styles.value}>{new Date(metrics.timestamp).toLocaleString()}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Browser:</span>
          <span className={styles.value}>{metrics.userAgent.split(" ")[0]}</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Navigation Timing</h2>
        
        <TimingRow 
          label="DNS Lookup" 
          value={metrics.dns} 
          grade={getGrade(metrics.dns, { good: 100, poor: 300 })}
        />
        <TimingRow 
          label="TCP Connection" 
          value={metrics.tcp} 
          grade={getGrade(metrics.tcp, { good: 100, poor: 300 })}
        />
        <TimingRow 
          label="SSL Handshake" 
          value={metrics.ssl} 
          grade={getGrade(metrics.ssl, { good: 100, poor: 300 })}
        />
        <TimingRow 
          label="TTFB (Time to First Byte)" 
          value={metrics.ttfb} 
          grade={getGrade(metrics.ttfb, { good: 200, poor: 600 })}
        />
        <TimingRow 
          label="Response Time" 
          value={metrics.response} 
          grade={getGrade(metrics.response, { good: 200, poor: 600 })}
        />
        <TimingRow 
          label="DOM Interactive" 
          value={metrics.domInteractive} 
          grade={getGrade(metrics.domInteractive, { good: 800, poor: 1800 })}
        />
        <TimingRow 
          label="DOM Complete" 
          value={metrics.domComplete} 
          grade={getGrade(metrics.domComplete, { good: 1500, poor: 3000 })}
        />
        <TimingRow 
          label="Load Complete" 
          value={metrics.loadComplete} 
          grade={getGrade(metrics.loadComplete, { good: 2000, poor: 4000 })}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Web Vitals</h2>
        
        <TimingRow 
          label="LCP (Largest Contentful Paint)" 
          value={metrics.lcp} 
          grade={metrics.lcp ? getGrade(metrics.lcp, { good: 2500, poor: 4000 }) : undefined}
          pending={metrics.lcp === undefined}
        />
        <TimingRow 
          label="FCP (First Contentful Paint)" 
          value={metrics.fcp} 
          grade={metrics.fcp ? getGrade(metrics.fcp, { good: 1800, poor: 3000 }) : undefined}
          pending={metrics.fcp === undefined}
        />
        <TimingRow 
          label="CLS (Cumulative Layout Shift)" 
          value={metrics.cls !== undefined ? metrics.cls * 1000 : undefined}
          unit="‰"
          grade={metrics.cls !== undefined ? getGrade(metrics.cls, { good: 0.1, poor: 0.25 }) : undefined}
          pending={metrics.cls === undefined}
        />
        <TimingRow 
          label="FID (First Input Delay)" 
          value={metrics.fid} 
          grade={metrics.fid ? getGrade(metrics.fid, { good: 100, poor: 300 }) : undefined}
          pending={metrics.fid === undefined}
        />
      </div>

      <div className={styles.actions}>
        <button onClick={copyResults} className={styles.button}>
          Copy Results
        </button>
        <button onClick={() => window.location.reload()} className={styles.buttonSecondary}>
          Run Again
        </button>
      </div>

      <div className={styles.legend}>
        <span><span className={styles.dot} style={{ background: "#16a34a" }} /> Good</span>
        <span><span className={styles.dot} style={{ background: "#ca8a04" }} /> Needs Improvement</span>
        <span><span className={styles.dot} style={{ background: "#dc2626" }} /> Poor</span>
      </div>
    </div>
  );
}

function TimingRow({ 
  label, 
  value, 
  grade, 
  unit = "ms",
  pending = false 
}: { 
  label: string; 
  value: number | undefined; 
  grade?: { grade: string; color: string };
  unit?: string;
  pending?: boolean;
}) {
  return (
    <div className={styles.timingRow}>
      <span className={styles.timingLabel}>{label}</span>
      <span className={styles.timingValue}>
        {pending ? (
          <span className={styles.pending}>collecting...</span>
        ) : value !== undefined ? (
          <>
            <span className={styles.number}>{value.toFixed(unit === "‰" ? 2 : 0)}</span>
            <span className={styles.unit}>{unit}</span>
            {grade && (
              <span 
                className={styles.grade} 
                style={{ background: grade.color }}
              >
                {grade.grade}
              </span>
            )}
          </>
        ) : (
          <span className={styles.na}>N/A</span>
        )}
      </span>
    </div>
  );
}
