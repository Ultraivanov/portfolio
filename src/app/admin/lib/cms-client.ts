import type { CaseInfo, CaseStudy } from "../types";

type SaveContentResponse = {
  success?: boolean;
  error?: string;
  code?: string;
};

type UploadResponse = {
  success?: boolean;
  error?: string;
  code?: string;
  path?: string;
  url?: string;
};

const parseError = (data: unknown, fallback: string) =>
  typeof data === "object" &&
  data !== null &&
  "error" in data &&
  typeof data.error === "string"
    ? data.error
    : fallback;

export const fetchCasesList = async (): Promise<CaseInfo[]> => {
  const response = await fetch("/api/cases", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load cases");
  }
  return (await response.json()) as CaseInfo[];
};

export const fetchCaseData = async (slug: string): Promise<CaseStudy> => {
  const response = await fetch(`/api/cases/${slug}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load case content");
  }
  return (await response.json()) as CaseStudy;
};

export const saveCaseContent = async (params: {
  slug: string;
  content: CaseStudy;
  message?: string;
}) => {
  const path = `src/content/cases/${params.slug}.json`;
  const response = await fetch("/api/save-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path,
      content: params.content,
      message: params.message ?? `Update ${params.slug} case`,
    }),
  });

  const data = (await response.json()) as SaveContentResponse;
  if (!response.ok) {
    throw new Error(parseError(data, "Failed to save"));
  }

  return data;
};

export const uploadCaseImage = async (params: { file: File; path: string }) => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("path", params.path);

  const response = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as UploadResponse;
  if (!response.ok) {
    throw new Error(parseError(data, "Upload failed"));
  }

  return data;
};
