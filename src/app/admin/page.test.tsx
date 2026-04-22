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
    window.localStorage.clear();
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

  it("shows AI intake panel when no case data is loaded yet", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/cases") {
        return mockJsonResponse({ items: [] });
      }

      return mockJsonResponse({ error: "Unexpected url" }, false);
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    render(<AdminPage />);

    await screen.findByText("AI Intake (GitHub)");
    expect(
      screen.getByText("Select an existing case or create a new one to unlock full editor fields.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));

    await waitFor(() => {
      expect(
        screen.getByText("❌ Select or create a case before generating a draft.")
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/cases", { cache: "no-store" });
  });

  it("does not render legacy media variant options", async () => {
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

      return mockJsonResponse({ error: "Unexpected url" }, false);
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    render(<AdminPage />);
    await screen.findByText("Sections");

    const optionValues = Array.from(document.querySelectorAll("option"))
      .map((option) => option.getAttribute("value") || "")
      .map((value) => value.trim().toLowerCase());

    expect(optionValues).not.toContain("diagram");
    expect(optionValues).not.toContain("phone");
    expect(optionValues).not.toContain("desktop");
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
      expect(screen.getByRole("button", { name: "No Changes" })).toBeDisabled();
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
        return mockTextErrorResponse("Request Entity Too Large");
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
      expect(
        screen.getByText(
          "❌ Upload failed: Upload payload exceeds platform limit. Keep files below approximately 3.34 MB and retry."
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "❌ Error: Upload payload exceeds platform limit. Keep files below approximately 3.34 MB and retry."
        )
      ).toBeInTheDocument();
    });
  });

  it("blocks oversized media files before calling upload API", async () => {
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
    const mediaInput = fileInputs[1];
    const largeFile = new File([new Uint8Array(3_700_000)], "too-big.svg", {
      type: "image/svg+xml",
    });
    fireEvent.change(mediaInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/❌ Upload failed: File is too large/)).toBeInTheDocument();
      expect(screen.getAllByText(/CMS upload limit is approximately 3\.34 MB/).length).toBeGreaterThan(0);
    });

    const uploadCalls = fetchMock.mock.calls.filter((call) => call[0] === "/api/upload-image");
    expect(uploadCalls).toHaveLength(0);
  });

  it("offers restore for local draft and applies it", async () => {
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

      return mockJsonResponse({ error: "Unexpected url" }, false);
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    window.localStorage.setItem(
      "cms-case-draft:megamod",
      JSON.stringify({
        version: 1,
        updatedAt: "2026-04-15T10:00:00.000Z",
        data: {
          ...mediaCase,
          title: "Megamod Draft Title",
        },
      })
    );

    render(<AdminPage />);

    await screen.findByRole("button", { name: "Restore Draft" });
    fireEvent.click(screen.getByRole("button", { name: "Restore Draft" }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Megamod Draft Title")).toBeInTheDocument();
      expect(screen.getByText(/Restored local draft/i)).toBeInTheDocument();
    });
  });

  it("runs smoke flow upload -> save -> reload and keeps uploaded media path", async () => {
    const fixedTimestamp = 1_710_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(fixedTimestamp);
    jest.spyOn(window, "confirm").mockReturnValue(true);

    let serverCase = JSON.parse(JSON.stringify(mediaCase)) as typeof mediaCase;
    let currentSha = "sha-initial";

    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/cases") {
        return mockJsonResponse({
          items: [{ slug: "megamod", title: "Megamod" }],
        });
      }

      if (url === "/api/cases/megamod") {
        return mockJsonResponse({ item: serverCase, sha: currentSha });
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

      if (url === "/api/save-content") {
        const body = JSON.parse(String(init?.body || "{}")) as {
          content?: typeof mediaCase;
        };
        if (!body.content) {
          return mockJsonResponse({ error: { message: "Missing content" } }, false);
        }
        serverCase = body.content;
        currentSha = "sha-saved";
        return mockJsonResponse({ success: true, sha: currentSha });
      }

      if (url === "/api/upload-image/cleanup") {
        return mockJsonResponse({ success: true, skipped: true, reason: "referenced" });
      }

      return mockJsonResponse({ error: "Unexpected url" }, false);
    });

    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const { container, unmount } = render(<AdminPage />);

    await screen.findByText("Sections");

    const fileInputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(fileInputs.length).toBeGreaterThan(1);
    const mediaInput = fileInputs[1];
    const file = new File(["<svg></svg>"], "smoke.svg", { type: "image/svg+xml" });
    fireEvent.change(mediaInput, { target: { files: [file] } });

    const expectedMediaPath = `/cases/megamod/${fixedTimestamp}.svg`;

    await waitFor(() => {
      expect(screen.getByText("✅ Uploaded: smoke.svg")).toBeInTheDocument();
      expect(screen.getByDisplayValue(expectedMediaPath)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByText("✅ Saved! Changes will deploy in ~1 minute.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "No Changes" })).toBeDisabled();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/upload-image", expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith("/api/save-content", expect.any(Object));

    unmount();
    render(<AdminPage />);

    await screen.findByText("Sections");
    await waitFor(() => {
      expect(screen.getByDisplayValue(expectedMediaPath)).toBeInTheDocument();
    });
  });
});
