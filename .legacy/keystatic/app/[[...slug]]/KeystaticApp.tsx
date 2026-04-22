"use client";

import { Keystatic } from "@keystatic/core/ui";
import keystaticConfig from "../../../../keystatic.config";

export default function KeystaticApp() {
  const config = keystaticConfig as unknown as import("@keystatic/core").Config;

  return (
    <Keystatic
      config={config}
      appSlug={{
        envName: "NEXT_PUBLIC_CMS_GITHUB_APP_SLUG",
        value: process.env.NEXT_PUBLIC_CMS_GITHUB_APP_SLUG,
      }}
    />
  );
}
