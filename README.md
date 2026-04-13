# Portfolio — Dima Ginzburg

Minimal, product-oriented portfolio built with Next.js App Router and TypeScript.

## Product Direction
- Product-first, not visual-first
- Minimal/brutalist visual language
- Content-driven architecture (JSON as source of content)
- Gravity UI as base UI kit with restrained customization

## Stack
- Next.js 16.2.1
- React 19
- TypeScript 5
- `@gravity-ui/uikit`
- CSS Modules
- Jest + Testing Library

## Routes
- `/` — homepage
- `/work` — case listing
- `/work/[slug]` — case detail
- `/contact`, `/cv`, `/privacy`, `/terms`
- `/admin` — custom CMS
- `/perf-test` — runtime/performance diagnostics

## Content
- Home content: `src/content/home.json`
- Cases: `src/content/cases/*.json`
- Case loading/types: `src/content/cases.ts`

Current case slugs:
1. `travel-booking-platform`
2. `railway-booking-flow`
3. `megamod`
4. `my-perfect-greek-vacation`
5. `design-system-runtime`

## CMS
Custom GitHub-backed CMS on `/admin`:
- `GET /api/cases`
- `GET /api/cases/[slug]`
- `POST /api/save-content`
- `POST /api/upload-image`

Required env vars:
- `GITHUB_PAT`
- `GITHUB_REPO`
- `CMS_ADMIN_USER`
- `CMS_ADMIN_PASSWORD`

## Development
```bash
npm run dev
npm run build
npm run test
npm run lint
```

## Single Source of Truth (Workflow State)
Use only `.codex/*` for project status and phase tracking:
- `.codex/SNAPSHOT.md`
- `.codex/PHASES.md`
- `.codex/blocks/*.md`

`.assistant/*` is legacy and kept for compatibility only.
