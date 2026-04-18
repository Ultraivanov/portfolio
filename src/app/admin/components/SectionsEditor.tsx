"use client";

import { useState, type CSSProperties } from "react";

type BlockValue = {
  text?: string;
  items?: string[];
  label?: string;
  href?: string;
  src?: string;
  alt?: string;
  caption?: string;
};

type Block = {
  discriminant: "paragraph" | "list" | "link" | "media";
  value: BlockValue;
};

type Section = {
  title: string;
  blocks: Block[];
};

type MediaUploadFeedback = {
  fileName?: string;
  uploading?: boolean;
  uploaded?: boolean;
  sizeText?: string;
  processedText?: string;
  errorText?: string;
};

type SectionsEditorProps = {
  sections: Section[];
  inputStyle: CSSProperties;
  labelStyle: CSSProperties;
  mediaUploadFeedbackByBlock: Record<string, MediaUploadFeedback>;
  onUpdateSection: (sectionIndex: number, title: string) => void;
  onRemoveSection: (sectionIndex: number) => void;
  onUpdateBlock: (
    sectionIndex: number,
    blockIndex: number,
    value: Partial<BlockValue>
  ) => void;
  onAddBlock: (sectionIndex: number, type: Block["discriminant"]) => void;
  onRemoveBlock: (sectionIndex: number, blockIndex: number) => void;
  onMoveBlock: (sectionIndex: number, fromIndex: number, toIndex: number) => void;
  onAddSection: () => void;
  onUploadMediaImage: (sectionIndex: number, blockIndex: number, file: File) => void;
};

export default function SectionsEditor({
  sections,
  inputStyle,
  labelStyle,
  mediaUploadFeedbackByBlock,
  onUpdateSection,
  onRemoveSection,
  onUpdateBlock,
  onAddBlock,
  onRemoveBlock,
  onMoveBlock,
  onAddSection,
  onUploadMediaImage,
}: SectionsEditorProps) {
  const [draggedBlock, setDraggedBlock] = useState<{
    sectionIndex: number;
    blockIndex: number;
  } | null>(null);
  const getBlockKey = (sectionIndex: number, blockIndex: number): string =>
    `${sectionIndex}:${blockIndex}`;

  return (
    <div style={{ marginTop: 32, borderTop: "1px solid var(--color-border-subtle)", paddingTop: 24 }}>
      <h2 style={{ fontSize: 18, marginBottom: 16, fontWeight: 600 }}>Sections</h2>

      {sections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          style={{
            marginBottom: 24,
            padding: 16,
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-1)",
            background: "var(--color-bg)",
          }}
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdateSection(sectionIndex, e.target.value)}
              style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
              placeholder="Section title"
            />
            <button
              onClick={() => onRemoveSection(sectionIndex)}
              style={{
                padding: "8px 12px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-1)",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {section.blocks.map((block, blockIndex) => {
            const feedback = mediaUploadFeedbackByBlock[getBlockKey(sectionIndex, blockIndex)];

            return (
              <div
                key={blockIndex}
                draggable
                onDragStart={() => setDraggedBlock({ sectionIndex, blockIndex })}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!draggedBlock || draggedBlock.sectionIndex !== sectionIndex) return;
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggedBlock || draggedBlock.sectionIndex !== sectionIndex) return;
                  onMoveBlock(sectionIndex, draggedBlock.blockIndex, blockIndex);
                  setDraggedBlock(null);
                }}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  border: "1px dashed var(--color-border-subtle)",
                  borderRadius: "var(--radius-1)",
                  background: "var(--color-bg-secondary)",
                  cursor: "move",
                  overflow: "visible",
                  opacity:
                    draggedBlock?.sectionIndex === sectionIndex &&
                    draggedBlock?.blockIndex === blockIndex
                      ? 0.5
                      : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      flex: 1,
                    }}
                  >
                    {block.discriminant}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-muted)",
                      userSelect: "none",
                    }}
                  >
                    ↕ Drag to reorder
                  </span>
                </div>

                {block.discriminant === "paragraph" && (
                  <textarea
                    value={block.value.text || ""}
                    onChange={(e) => onUpdateBlock(sectionIndex, blockIndex, { text: e.target.value })}
                    style={{ ...inputStyle, minHeight: 100, height: "auto", resize: "vertical" }}
                    placeholder="Paragraph text..."
                    rows={4}
                  />
                )}

                {block.discriminant === "list" && (
                  <div>
                    {(block.value.items || []).map((item, itemIndex) => (
                      <input
                        key={itemIndex}
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newItems = [...(block.value.items || [])];
                          newItems[itemIndex] = e.target.value;
                          onUpdateBlock(sectionIndex, blockIndex, { items: newItems });
                        }}
                        style={{ ...inputStyle, marginBottom: 4 }}
                        placeholder={`Item ${itemIndex + 1}`}
                      />
                    ))}
                    <button
                      onClick={() => {
                        const newItems = [...(block.value.items || []), ""];
                        onUpdateBlock(sectionIndex, blockIndex, { items: newItems });
                      }}
                      style={{
                        padding: "4px 12px",
                        background: "transparent",
                        color: "var(--color-text-muted)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "var(--radius-1)",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      + Add item
                    </button>
                  </div>
                )}

                {block.discriminant === "link" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={block.value.label || ""}
                      onChange={(e) => onUpdateBlock(sectionIndex, blockIndex, { label: e.target.value })}
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="Link label"
                    />
                    <input
                      type="text"
                      value={block.value.href || ""}
                      onChange={(e) => onUpdateBlock(sectionIndex, blockIndex, { href: e.target.value })}
                      style={{ ...inputStyle, flex: 2 }}
                      placeholder="https://..."
                    />
                  </div>
                )}

                {block.discriminant === "media" && (
                  <div style={{ padding: 12, background: "var(--color-bg)", borderRadius: "var(--radius-1)" }}>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Image path:</label>
                      <input
                        type="text"
                        value={block.value.src || ""}
                        onChange={(e) => onUpdateBlock(sectionIndex, blockIndex, { src: e.target.value })}
                        style={{ ...inputStyle, marginBottom: 8 }}
                        placeholder="/cases/example/image.png"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void onUploadMediaImage(sectionIndex, blockIndex, file);
                          }
                        }}
                        style={{ fontSize: 14, color: "var(--color-text-primary)" }}
                      />
                      {feedback ? (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 12,
                            color: "var(--color-text-muted)",
                            display: "grid",
                            gap: 4,
                          }}
                        >
                          <div>
                            {feedback.uploaded ? "✅" : feedback.uploading ? "⏳" : "⬜"} Uploaded
                            {feedback.fileName ? `: ${feedback.fileName}` : ""}
                          </div>
                          <div>
                            {feedback.sizeText ? "✅" : "⬜"} Size
                            {feedback.sizeText ? `: ${feedback.sizeText}` : ""}
                          </div>
                          <div>
                            {feedback.processedText ? "✅" : "⬜"} Processed
                            {feedback.processedText ? `: ${feedback.processedText}` : ""}
                          </div>
                          {feedback.errorText ? (
                            <div style={{ color: "#f87171" }}>❌ Error: {feedback.errorText}</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {block.value.src ? (
                      <div style={{ marginBottom: 8 }}>
                        <img
                          src={block.value.src}
                          alt={block.value.alt || ""}
                          style={{
                            maxWidth: 150,
                            maxHeight: 100,
                            borderRadius: "var(--radius-1)",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    ) : null}

                    <input
                      type="text"
                      value={block.value.alt || ""}
                      onChange={(e) => onUpdateBlock(sectionIndex, blockIndex, { alt: e.target.value })}
                      style={{ ...inputStyle, fontSize: 14, marginBottom: 8 }}
                      placeholder="Alt text..."
                    />

                    <input
                      type="text"
                      value={block.value.caption || ""}
                      onChange={(e) => onUpdateBlock(sectionIndex, blockIndex, { caption: e.target.value })}
                      style={{ ...inputStyle, fontSize: 14, marginBottom: 8 }}
                      placeholder="Caption..."
                    />
                  </div>
                )}

                <button
                  onClick={() => onRemoveBlock(sectionIndex, blockIndex)}
                  style={{
                    marginTop: 8,
                    padding: "4px 12px",
                    background: "transparent",
                    color: "#dc2626",
                    border: "1px solid #dc2626",
                    borderRadius: "var(--radius-1)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Remove block
                </button>
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["paragraph", "list", "link", "media"] as const).map((type) => (
              <button
                key={type}
                onClick={() => onAddBlock(sectionIndex, type)}
                style={{
                  padding: "6px 12px",
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-1)",
                  cursor: "pointer",
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
              >
                + {type}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={onAddSection}
        style={{
          padding: "12px 24px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "var(--radius-1)",
          cursor: "pointer",
        }}
      >
        + Add Section
      </button>
    </div>
  );
}
