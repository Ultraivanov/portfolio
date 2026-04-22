# Snapshot — Portfolio Project

Date: 2026-04-16
Status: Production-ready site + active V2 CMS/AI acceleration track
Source of truth: this file (`.codex/SNAPSHOT.md`)

## Workflow State
- `.codex` phase/block/task routing is synchronized: active block `R-02` now points to `.codex/blocks/R-02.md`.
- Session work follows approval gates: Change Plan -> user `yes` -> implementation -> separate commit/push confirmations.

## Product Context
- Portfolio for product designer (Dima Ginzburg)
- Positioning: product-first, minimal/brutalist, content-driven
- Target: Russian-speaking product teams and global product companies

## Current Stack
- Next.js 16.2.1 (App Router)
- TypeScript 5
- React 19
- Gravity UI (`@gravity-ui/uikit`)
- CSS Modules
- Jest + React Testing Library

## Current Routes
- `/` — homepage
- `/work` — case listing
- `/work/[slug]` — case detail
- `/contact`, `/cv`, `/privacy`, `/terms`
- `/admin` — custom GitHub-backed CMS
- `/perf-test` — diagnostics page
- `/api/cases`, `/api/contact`, `/api/save-content`, `/api/upload-image`, `/api/theme`
- `/api/intake/github` — AI draft intake from GitHub signals
- `/api/intake/github/runtime-import` — runtime screenshot import into case assets

## Content Model
- Content source: `src/content/` JSON + typed loader (`src/content/cases.ts`)
- Case files: `src/content/cases/*.json`
- Homepage source: `src/content/home.json`
- Case block types: `paragraph`, `list`, `link`, `media`
- Case structure target for AI drafts: Context, Problem, Constraints, Role, Approach, Solution, Outcome

## Current Case Slugs (ordered)
1. `travel-booking-platform`
2. `railway-booking-flow`
3. `megamod`
4. `my-perfect-greek-vacation`
5. `design-system-runtime`

## CMS + AI Status
- Admin UI: `src/app/admin/page.tsx`
- Save pipeline: GitHub API commit flow via `/api/save-content`
- Image upload: `/api/upload-image`
- Auth: basic auth vars (`CMS_ADMIN_USER`, `CMS_ADMIN_PASSWORD`) in `middleware.ts`
- GitHub AI intake implemented (MVP):
  - Signals: repo metadata + README + merged PRs + closed issues
  - Modes: `llm` (default) and `heuristic`
  - Evidence links + route candidates + runtime screenshot plan are exposed in UI
  - Draft-only application with user confirmation remains default behavior
- Runtime screenshot import implemented:
  - Extractor command `import_runtime_screenshot`
  - Uploads to `public/cases/<slug>/...`
  - Auto-applies imported assets into `Visual Artifacts`

## AI Runtime/Config Notes
- Required for LLM mode: `OPENAI_API_KEY`
- Optional model override: `GITHUB_INTAKE_LLM_MODEL` (default in code: `gpt-4.1-mini`)
- Optional screenshot template: `GITHUB_INTAKE_SCREENSHOT_TEMPLATE`
- GitHub write path for CMS/extractor: `GITHUB_PAT`, `GITHUB_REPO`, `GITHUB_BRANCH`

## Roadmap Gap Status (as of 2026-04-16)
- 4.1 Repo -> Case Draft: baseline implemented
- 4.2 Narrative Gap Detector: pending
- 4.3 Artifact-to-Block Auto Mapper: partial (runtime screenshot import + media/link merge present)
- 4.4 Case Consistency QA Bot: pending
- 4.5 One-Click Case Starter: pending

## Workspace Hygiene Notes
- Unexpected duplicate files with suffix ` 2` were detected in `src/`, `cms-extract/`, and `public/`.
- Most are byte-identical copies; some are older intermediate revisions.
- They are not part of the active source-of-truth paths and should be cleaned in a dedicated hygiene pass.

## Git/Workspace Notes
- Main branch: `main`
- Canonical workflow files: `.codex/*`
- Legacy assistant workflow files are retained but should not be used as active status tracking

## Known Follow-ups
- Keep `.codex/SNAPSHOT.md` updated after meaningful project changes
- Keep `README.md` aligned with real project state (including AI intake env vars)
- Resolve duplicate `* 2.*` files in a controlled cleanup pass
