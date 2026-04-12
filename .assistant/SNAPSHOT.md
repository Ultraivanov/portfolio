# Snapshot — Portfolio Project

Date: 2026-04-12
Status: **Production Ready** — Homepage + 5 Case Studies

---

## Recent Improvements (2026-04-12)

### Code Quality
- **Fixed duplicate types** in `src/content/cases.ts` — removed redundant `CaseSectionContent` union members
- **Added form validation** in admin CMS — validates required fields (title, slug, coverAlt, fact labels, section titles) before save
- **Fixed fact value handling** — admin now properly handles both `string` and `string[]` fact values with UI toggle
- **Extracted CSS** — created `admin.module.css` to replace inline styles in CMS

### Architecture
- **Cleaned up Keystatic references** — removed all Keystatic-related code from components (ClientProviders, Layout, ThemeToggle, middleware)
- **Moved legacy code** to `.legacy/keystatic/` with documentation

---

## Project Overview

Product designer portfolio for Dima Ginzburg. Built with Next.js + TypeScript + Gravity UI. Targets Russian-speaking product teams and global companies.

**Live URL:** https://ginzburg.work  
**Repo:** Ultraivanov/portfolio

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.1 (App Router) |
| Language | TypeScript 5 |
| UI Kit | @gravity-ui/uikit 7.35 |
| CMS | **Custom CMS** (GitHub API-based) — see `/admin` |
| Styling | CSS Modules |
| Testing | Jest 30 + React Testing Library |
| Analytics | Custom events (trackEvent) |

---

## Architecture

### App Router Structure
```
src/app/
├── page.tsx              # Homepage (renders HomePage component)
├── layout.tsx            # Root layout with metadata, ClientProviders
├── globals.css           # Global styles + Gravity UI theme vars
├── work/
│   ├── page.tsx          # Case listing page
│   └── [slug]/page.tsx   # Individual case study page
├── contact/page.tsx      # Contact page
├── cv/page.tsx           # CV page
├── admin/page.tsx        # **Custom CMS UI**
├── perf-test/page.tsx    # Performance diagnostics page (client-only)
├── api/cases/            # CMS API: list/get cases
├── api/save-content/     # CMS API: save to GitHub
├── api/upload-image/     # CMS API: image upload
├── terms/page.tsx        # Legal pages
└── privacy/page.tsx
```

### Component Structure
```
src/components/
├── home/                 # Homepage sections
│   ├── HomePage.tsx      # Main homepage component
│   └── home-page.module.css
├── case/                 # Case study components
│   ├── CasePage.tsx      # Individual case renderer
│   ├── CaseContent.tsx   # Case content blocks
│   ├── CaseFacts.tsx     # Facts grid component
│   └── [6 more files]
├── case-list/            # Case listing
├── layout/               # Layout wrapper, header, nav, footer
├── contact/              # Contact form components
├── legal/                # Legal page template
├── ClientProviders.tsx   # Theme + Gravity UI provider
└── analytics/            # Analytics utilities
```

### Content Architecture
```
src/content/
├── cases.ts              # Case loading logic + types
├── home.ts / home.json   # Homepage content (data-driven)
├── contact.ts            # Contact page content
└── cases/                # 5 case study JSON files
    ├── travel-booking-platform.json
    ├── railway-booking-flow.json
    ├── megamod.json
    ├── my-perfect-greek-vacation.json
    └── design-system-runtime.json
```

---

## Content Schema

### Case Study Structure (`CaseStudy` type)
```typescript
{
  slug: string
  title: string
  subtitle: string
  coverSrc: string
  coverAlt: string
  facts: { label, value, href? }[]
  sections: {
    title: string
    blocks: (paragraph | list | link | media)[]
  }[]
}
```

### Homepage Content Structure
```typescript
{
  hero: { headline, ctaLabel, ctaHref, secondaryCtaLabel, secondaryCtaHref }
  about: { name, role, avatarSrc, description }
  cover: { src, alt }
  skills: { label, groups: [{ title, items: [] }] }
  tools: { label, groups: [{ title?, items: [] }] }
  pastProjects: { label, maxItems, featuredCases: string[], items: [] }
  resources: { label, items: [{ title, description, linkLabel, href }] }
  cta: { titleLine1, titleLine2, highlight, description, links: [] }
}
```

---

## Available Case Studies

| Slug | Title | Status |
|------|-------|--------|
| travel-booking-platform | RZD — Sanatorium & Resort Booking Service | Live |
| railway-booking-flow | Russian Railways — Communication Workflow System | Live |
| megamod | MegaMod — Multi-Product UGC Gaming Ecosystem | Live |
| my-perfect-greek-vacation | My Perfect Greek Vacation | Live |
| design-system-runtime | Design System Runtime | Live |

**Featured order** (in `home.json` and `cases.ts`):
1. travel-booking-platform
2. railway-booking-flow
3. megamod
4. my-perfect-greek-vacation
5. design-system-runtime

---

## Key Implementation Details

### Homepage (`page.tsx` → `HomePage.tsx`)
- Fetches cases from `cases.ts` based on `featuredCases` array in `home.json`
- Maps case data to project cards dynamically
- Falls back to static items if no cases match
- Uses real case data: title, subtitle, coverSrc, coverAlt
- Limit: `maxItems: 4` (configurable in home.json)

### Case Study Pages
- Route: `/work/[slug]`
- Component: `CasePage` with `CaseContent`, `CaseFacts`
- Content loaded from `src/content/cases/[slug].json`
- Supports 4 block types: paragraph, list, link, media
- Media variants: phone | desktop | diagram

### Analytics
- `trackEvent(event, payload)` utility in `lib/analytics.ts`
- Events: `case_click`, `resource_click`, `nav_click`
- No external analytics service — events logged to console/dev tools

### Theming
- Gravity UI `ThemeProvider` in `ClientProviders.tsx`
- Dark/light mode support via `useThemeMode()` hook
- CSS custom properties for brand colors

### Performance Test Page (`/perf-test`)
- Client-only page, no layout wrapper (standalone)
- Collects Navigation Timing API + Web Vitals (LCP, FCP, CLS, FID)
- Detects Telegram WebView via User Agent
- Grades each metric: A (good) / B (needs improvement) / C (poor)
- "Copy Results" exports plain-text report to clipboard
- **Purpose:** debugging real-user performance in various environments (Telegram, mobile browsers)
- **URL:** https://ginzburg.work/perf-test

### Custom CMS (GitHub-backed)
- **Location:** `/admin` route (`src/app/admin/page.tsx`)
- **Backend:** GitHub API via `GITHUB_PAT`
- **Features:**
  - Edit case studies (title, subtitle, cover, facts, sections)
  - Block editor: paragraph, list, link, media
  - Image upload to `/public/cases/[slug]/`
  - JSON preview
  - Auto-commit to repo
- **API endpoints:**
  - `GET /api/cases` — list all cases
  - `GET /api/cases/[slug]` — get case data
  - `POST /api/save-content` — save JSON to GitHub
  - `POST /api/upload-image` — upload images to GitHub
- **Auth:** Basic auth via `CMS_ADMIN_USER/PASSWORD` (middleware.ts)
- **Legacy:** Keystatic moved to `.legacy/keystatic/` (backup)

---

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run test     # Run Jest tests
npm run test:watch  # Watch mode
npm run lint     # ESLint
```

---

## Design Principles (from AGENTS.md)

1. **Product-first** — Structure over decoration
2. **Minimal / brutalist** — No gradients, glass, blobs
3. **Content-driven** — JSON source of truth
4. **Strong typography** — Hierarchy via spacing and type
5. **Desktop-first** — Max-width ~1200px, left-aligned

---

## Open Items / Future Work

- [ ] Add more case studies (3-5 additional)
- [ ] Add filtering/sorting to case listing
- [ ] Case study search functionality
- [ ] Add video/media support to case blocks
- [ ] CV page content enrichment
- [ ] Contact form backend integration
- [ ] SEO optimization for case studies

---

## Critical Files

| File | Purpose |
|------|---------|
| `src/content/cases.ts` | Case loading + types |
| `src/content/home.json` | Homepage content |
| `src/components/home/HomePage.tsx` | Homepage renderer |
| `src/components/case/CasePage.tsx` | Case study renderer |
| `src/app/layout.tsx` | Root layout, metadata |
| `src/app/admin/page.tsx` | Custom CMS UI |
| `src/app/api/save-content/route.ts` | CMS save API |

---

## Content Update Workflow

1. **Via Custom CMS:** `/admin` → select case → edit → save → auto-commit
2. **Via Git:** Edit JSON directly in `src/content/cases/` or `src/content/home.json`
3. **Deploy:** Auto-deploy on push (Vercel/GitHub integration)

### CMS Environment Variables
```bash
# Required for CMS
GITHUB_PAT=ghp_xxx               # GitHub Personal Access Token
GITHUB_REPO=Ultraivanov/portfolio
CMS_ADMIN_USER=admin             # Or legacy: KEYSTATIC_ADMIN_USER
CMS_ADMIN_PASSWORD=xxx         # Or legacy: KEYSTATIC_ADMIN_PASSWORD
```

---

*Snapshot captured: 2026-04-12 — Project stable and production-ready*
