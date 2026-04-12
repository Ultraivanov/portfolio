"use client";

import { useState, useEffect } from "react";

interface CaseInfo {
  slug: string;
  title: string;
}

export default function AdminPage() {
  const [cases, setCases] = useState<CaseInfo[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load list of cases
  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((data: CaseInfo[]) => {
        setCases(data);
        if (data.length > 0) {
          setSelectedCase(data[0].slug);
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage("❌ Failed to load cases");
        setLoading(false);
      });
  }, []);

  // Load selected case content
  useEffect(() => {
    if (!selectedCase) return;
    fetch(`/api/cases/${selectedCase}`)
      .then((r) => r.json())
      .then((data) => {
        setContent(JSON.stringify(data, null, 2));
      })
      .catch(() => {
        setMessage("❌ Failed to load case content");
      });
  }, [selectedCase]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const parsed = JSON.parse(content);
      const path = `src/content/cases/${selectedCase}.json`;

      const response = await fetch("/api/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          content: parsed,
          message: `Update ${selectedCase} case`,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("✅ Saved! Changes will deploy in ~1 minute.");
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Content Admin</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          Select case:
        </label>
        <select
          value={selectedCase}
          onChange={(e) => setSelectedCase(e.target.value)}
          style={{
            padding: "8px 12px",
            fontSize: 16,
            borderRadius: 4,
            border: "1px solid #ccc",
            width: 300,
          }}
        >
          {cases.map((c: CaseInfo) => (
            <option key={c.slug} value={c.slug}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
          Content (JSON):
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: "100%",
            height: 500,
            padding: 12,
            fontFamily: "monospace",
            fontSize: 14,
            borderRadius: 4,
            border: "1px solid #444",
            background: "#1a1a1a",
            color: "#e5e5e5",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 24px",
            background: saving ? "#999" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 16,
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {message && (
          <span style={{ fontSize: 14, color: message.startsWith("✅") ? "green" : "red" }}>
            {message}
          </span>
        )}
      </div>

      {loading && <p>Loading...</p>}

      <p style={{ marginTop: 24, fontSize: 14, color: "#666" }}>
        Changes are saved directly to GitHub and automatically deployed by Vercel.
      </p>
    </div>
  );
}
