"use client";

import { useState, useEffect } from "react";

interface ContentItem {
  slug: string;
  [key: string]: unknown;
}

export default function AdminPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [itemData, setItemData] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load list
  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((data: ContentItem[]) => {
        setItems(data);
        if (data.length > 0) setSelectedSlug(data[0].slug);
        setLoading(false);
      })
      .catch(() => {
        setMessage("❌ Failed to load");
        setLoading(false);
      });
  }, []);

  // Load item
  useEffect(() => {
    if (!selectedSlug) return;
    fetch(`/api/content/${selectedSlug}`)
      .then((r) => r.json())
      .then((data: ContentItem) => setItemData(data))
      .catch(() => setMessage("❌ Failed to load item"));
  }, [selectedSlug]);

  const handleSave = async () => {
    if (!itemData) return;
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/save-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: `content/${selectedSlug}.json`,
        content: itemData,
        message: `Update ${selectedSlug}`,
      }),
    });

    const result = await response.json();
    setMessage(response.ok ? "✅ Saved!" : `❌ Error: ${result.error}`);
    setSaving(false);
  };

  const inputStyle = {
    padding: "8px 12px",
    fontSize: 16,
    borderRadius: "8px",
    border: "1px solid #ccc",
    width: "100%",
    marginBottom: 8,
  };

  const labelStyle = { display: "block", marginBottom: 4, fontWeight: 600 };

  if (loading || !itemData) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>GitCMS</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Select item:</label>
        <select
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          style={inputStyle}
        >
          {items.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.slug}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic JSON editor */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Content (JSON):</label>
        <textarea
          value={JSON.stringify(itemData, null, 2)}
          onChange={(e) => {
            try {
              setItemData(JSON.parse(e.target.value));
            } catch {}
          }}
          style={{ ...inputStyle, height: 400, fontFamily: "monospace", fontSize: 14 }}
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 24px",
            background: saving ? "#999" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {message && <span style={{ alignSelf: "center" }}>{message}</span>}
      </div>
    </div>
  );
}
