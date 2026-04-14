"use client";

import { useState, useEffect } from "react";

interface ContentItem {
  slug: string;
  [key: string]: unknown;
}

function getApiErrorMessage(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) return "Unknown error";
  const error = (payload as Record<string, unknown>).error;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string" && message) return message;
  }
  return "Unknown error";
}

export default function AdminPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [itemData, setItemData] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadingLatest, setReloadingLatest] = useState(false);
  const [hasContentConflict, setHasContentConflict] = useState(false);
  const [message, setMessage] = useState("");

  // Load list
  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((payload: { items?: ContentItem[] }) => {
        const data = Array.isArray(payload.items) ? payload.items : [];
        setItems(data);
        if (data.length > 0) setSelectedSlug(data[0].slug);
        setLoading(false);
      })
      .catch((error: unknown) => {
        setMessage(`❌ Failed to load: ${error instanceof Error ? error.message : "Unknown error"}`);
        setLoading(false);
      });
  }, []);

  const loadContentItem = async (slug: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/content/${slug}`);
      const payload = (await response.json()) as { item?: ContentItem };
      if (response.ok && payload.item) {
        setItemData(payload.item);
        return true;
      }
      setMessage("❌ Failed to load item");
      return false;
    } catch (error: unknown) {
      setMessage(`❌ Failed to load item: ${error instanceof Error ? error.message : "Unknown error"}`);
      return false;
    }
  };

  // Load item
  useEffect(() => {
    if (!selectedSlug) return;
    fetch(`/api/content/${selectedSlug}`)
      .then((r) => r.json())
      .then((payload: { item?: ContentItem }) => {
        if (payload.item) {
          setItemData(payload.item);
          return;
        }
        setMessage("❌ Failed to load item");
      })
      .catch((error: unknown) =>
        setMessage(`❌ Failed to load item: ${error instanceof Error ? error.message : "Unknown error"}`)
      );
  }, [selectedSlug]);

  const handleSave = async () => {
    if (!itemData) return;
    setSaving(true);
    setMessage("");
    setHasContentConflict(false);

    const response = await fetch("/api/save-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: `content/${selectedSlug}.json`,
        content: itemData,
        message: `Update ${selectedSlug}`,
      }),
    });

    const result = (await response.json()) as Record<string, unknown>;
    if (response.ok) {
      setMessage("✅ Saved!");
    } else {
      const error = result.error;
      const errorCode =
        typeof error === "object" && error !== null
          ? (error as { code?: string }).code
          : undefined;
      if (errorCode === "CONTENT_CONFLICT") {
        setHasContentConflict(true);
        setMessage("⚠️ Conflict: content changed in repository. Reload latest version and retry.");
      } else {
        const errorMessage = getApiErrorMessage(result);
        setMessage(`❌ Error: ${errorMessage}`);
      }
    }
    setSaving(false);
  };

  const handleReloadLatest = async () => {
    if (!selectedSlug) return;
    setReloadingLatest(true);
    const loaded = await loadContentItem(selectedSlug);
    if (loaded) {
      setHasContentConflict(false);
      setMessage("✅ Loaded latest content from repository. Review and save again.");
    }
    setReloadingLatest(false);
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
        {hasContentConflict && (
          <button
            onClick={handleReloadLatest}
            disabled={reloadingLatest}
            style={{
              padding: "12px 24px",
              background: reloadingLatest ? "#999" : "#d97706",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: reloadingLatest ? "not-allowed" : "pointer",
            }}
          >
            {reloadingLatest ? "Reloading..." : "Reload Latest"}
          </button>
        )}
        {message && <span style={{ alignSelf: "center" }}>{message}</span>}
      </div>
    </div>
  );
}
