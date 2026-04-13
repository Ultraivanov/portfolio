# Snapshot — Portfolio Project

Date: 2026-04-13
Status: Production ready (public site + CMS + case content)
Source of truth: this file (`.codex/SNAPSHOT.md`)

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

## Content Model
- Content source: `src/content/` JSON + typed loader (`src/content/cases.ts`)
- Case files: `src/content/cases/*.json`
- Homepage source: `src/content/home.json`
- Case block types: `paragraph`, `list`, `link`, `media`

## Current Case Slugs (ordered)
1. `travel-booking-platform`
2. `railway-booking-flow`
3. `megamod`
4. `my-perfect-greek-vacation`
5. `design-system-runtime`

## CMS Status
- Admin UI: `src/app/admin/page.tsx`
- Save pipeline: GitHub API commit flow via `/api/save-content`
- Image upload: `/api/upload-image`
- Auth: basic auth vars (`CMS_ADMIN_USER`, `CMS_ADMIN_PASSWORD`) in `middleware.ts`

## Git/Workspace Notes
- Main branch: `main` (local was behind `origin/main` during this snapshot)
- Local worktrees were used for parallel agent edits under `.claude/worktrees/`
- Canonical workflow files: `.codex/*`
- Legacy assistant workflow files are retained but should not be used as active status tracking

## Known Follow-ups
- Keep `.codex/SNAPSHOT.md` updated after meaningful project changes
- Keep `README.md` aligned with real project state (not starter template text)
- Avoid tracking local worktree paths in Git index
