"use client";

import { Keystatic } from "@keystatic/core/ui";
import keystaticConfig from "../../../../keystatic.config";

export default function KeystaticPage() {
  return (
    <Keystatic
      config={keystaticConfig}
      appSlug={{
        envName: "NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG",
        value: process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG,
      }}
    />
  );
}
