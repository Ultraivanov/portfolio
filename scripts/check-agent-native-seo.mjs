import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

const requiredFiles = [
  "src/lib/seo.ts",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "scripts/check-agent-native-seo.mjs",
  ".github/workflows/agent-native-seo-check.yml",
];

const contentChecks = [
  { file: "src/lib/seo.ts", includes: ["getSiteUrl", "toAbsoluteUrl", "PUBLIC_STATIC_ROUTES"] },
  { file: "src/app/robots.ts", includes: ["MetadataRoute.Robots", "sitemap", "/admin"] },
  { file: "src/app/sitemap.ts", includes: ["MetadataRoute.Sitemap", "PUBLIC_STATIC_ROUTES", "/work/"] },
  {
    file: ".github/workflows/agent-native-seo-check.yml",
    includes: ["check:seo:agent-native", "actions/checkout@v4", "actions/setup-node@v4"],
  },
];

const issues = [];

for (const relativePath of requiredFiles) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    issues.push(`Missing required file: ${relativePath}`);
  }
}

for (const check of contentChecks) {
  const fullPath = path.join(rootDir, check.file);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  const content = fs.readFileSync(fullPath, "utf8");
  for (const marker of check.includes) {
    if (!content.includes(marker)) {
      issues.push(`File ${check.file} is missing marker: "${marker}"`);
    }
  }
}

const packageJsonPath = path.join(rootDir, "package.json");
if (!fs.existsSync(packageJsonPath)) {
  issues.push("Missing package.json");
} else {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const scriptValue = packageJson?.scripts?.["check:seo:agent-native"];
  if (scriptValue !== "node scripts/check-agent-native-seo.mjs") {
    issues.push(
      'package.json scripts["check:seo:agent-native"] must equal "node scripts/check-agent-native-seo.mjs"'
    );
  }
}

if (issues.length > 0) {
  console.error("SEO baseline check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("SEO baseline check passed.");
