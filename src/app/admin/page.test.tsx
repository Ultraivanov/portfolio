import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminPage from "./page";

type MockResponsePayload = Record<string, unknown>;

const mockJsonResponse = (payload: MockResponsePayload, ok = true): Response =>
  ({
    ok,
    json: async () => payload,
  } as Response);

const mockTextErrorResponse = (
  text: string,
  status = 413,
  statusText = "Payload Too Large"
): Response =>
  ({
    ok: false,
    status,
    statusText,
    json: async () => {
      throw new Error("Invalid JSON");
    },
    text: async () => text,
  } as unknown as Response);

const mediaCase = {
  slug: "megamod",
  title: "Megamod",
  subtitle: "Subtitle",
  coverSrc: "/cases/megamod/cover.png",
  coverAlt: "Cover",
  facts: [],
  sections: [
    {
      title: "Approach",
      blocks: [{ discriminant: "media", value: { src: "", alt: "", caption: "" } }],
    },
  ],
};

describe("AdminPage media upload input state", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch) {
      Object.defineProperty(globalThis, "fetch", {
        configurable: true,
        writable: true,
        value: originalFetch,
      });
      return;
    }
    // jsdom in this repo does not provide fetch by default.
    delete (globalThis as { fetch?: unknown }).fetch;
  });

  it("shows explicit uploaded file status even after file input is reset", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url === "/api/cases") {
          return mockJsonResponse({
            items: [{ slug: "megamod", title: "Megamod" }],
          });
        }

        if (url === "/api/cases/megamod") {
          return mockJsonResponse({ item: mediaCase });
        }

        if (url === "/api/upload-image") {
          return mockJsonResponse({
            size: { beforeBytes: 2048, afterBytes: 1024 },
            svgOptimization: {
              optimized: true,
              originalBytes: 2048,
              optimizedBytes: 1024,
              usedAggressivePass: false,
            },
          });
        }

        return mockJsonResponse({ error: "Unexpected url" }, false);
      });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const { container } = render(<AdminPage />);

    await screen.findByText("Sections");

    const fileInputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(1);

    const mediaInput = fileInputs[1];
    const file = new File(["<svg></svg>"], "diagram.svg", { type: "image/svg+xml" });

    fireEvent.change(mediaInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("✅ Uploaded: diagram.svg")).toBeInTheDocument();
      expect(screen.getByText("✅ Size: 2.0 KB → 1.0 KB")).toBeInTheDocument();
      expect(screen.getByText("✅ Processed: SVG optimized")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Alt text...")).toHaveValue("diagram");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/upload-image", expect.any(Object));
  });

  it("disables save while media upload is in progress", async () => {
    let resolveUpload: ((value: Response) => void) | undefined;
    const uploadPromise = new Promise<Response>((resolve) => {
      resolveUpload = resolve;
    });

    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/cases") {
        return mockJsonResponse({
          items: [{ slug: "megamod", title: "Megamod" }],
        });
      }

      if (url === "/api/cases/megamod") {
        return mockJsonResponse({ item: mediaCase });
      }

      if (url === "/api/upload-image") {
        return uploadPromise;
      }

      if (url === "/api/save-content") {
        return mockJsonResponse({ success: true });
      }

      return mockJsonResponse({ error: "Unexpected url" }, false);
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const { container } = render(<AdminPage />);

    await screen.findByText("Sections");

    const fileInputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(1);

    const mediaInput = fileInputs[1];
    const file = new File(["<svg></svg>"], "hero.svg", { type: "image/svg+xml" });

    fireEvent.change(mediaInput, { target: { files: [file] } });

    await waitFor(() => {
      const saveButton = screen.getByRole("button", { name: "Uploading media..." });
      expect(saveButton).toBeDisabled();
    });

    resolveUpload?.(
      mockJsonResponse({
        size: { beforeBytes: 1024, afterBytes: 512 },
        svgOptimization: {
          optimized: true,
          originalBytes: 1024,
          optimizedBytes: 512,
          usedAggressivePass: false,
        },
      })
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
    });
  });

  it("recovers from failed media upload and re-enables save", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/cases") {
        return mockJsonResponse({
          items: [{ slug: "megamod", title: "Megamod" }],
        });
      }

      if (url === "/api/cases/megamod") {
        return mockJsonResponse({ item: mediaCase });
      }

      if (url === "/api/upload-image") {
        throw new Error("boom");
      }

      return mockJsonResponse({ error: "Unexpected url" }, false);
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const { container } = render(<AdminPage />);
    await screen.findByText("Sections");

    const fileInputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const mediaInput = fileInputs[1];
    const file = new File(["<svg></svg>"], "broken.svg", { type: "image/svg+xml" });
    fireEvent.change(mediaInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("❌ Upload failed: boom")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
    });
  });

  it("shows plain-text upload error instead of Unknown error", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/cases") {
        return mockJsonResponse({
          items: [{ slug: "megamod", title: "Megamod" }],
        });
      }

      if (url === "/api/cases/megamod") {
        return mockJsonResponse({ item: mediaCase });
      }

      if (url === "/api/upload-image") {
        return mockTextErrorResponse("Request body too large");
      }

      return mockJsonResponse({ error: "Unexpected url" }, false);
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const { container } = render(<AdminPage />);
    await screen.findByText("Sections");

    const fileInputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const mediaInput = fileInputs[1];
    const file = new File(["<svg></svg>"], "broken.svg", { type: "image/svg+xml" });
    fireEvent.change(mediaInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("❌ Upload failed: Request body too large")).toBeInTheDocument();
      expect(screen.getByText("❌ Error: Request body too large")).toBeInTheDocument();
    });
  });
});
