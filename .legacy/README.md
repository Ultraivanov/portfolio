# Legacy / Backup Components

This folder contains deprecated code that is no longer used in production but kept for reference.

## Contents

### `/keystatic/` — Keystatic CMS (Legacy)

Complete backup of the Keystatic CMS integration that was replaced by the custom GitHub-backed CMS.

| File | Original Location | Purpose |
|------|-------------------|---------|
| `keystatic.config.ts` | `/keystatic.config.ts` | Keystatic schema config |
| `app/[[...slug]]/page.tsx` | `/src/app/keystatic/[[...slug]]/page.tsx` | Keystatic UI entry |
| `app/[[...slug]]/KeystaticApp.tsx` | `/src/app/keystatic/[[...slug]]/KeystaticApp.tsx` | Keystatic React app |
| `api/keystatic/[[...params]]/route.ts` | `/src/app/api/keystatic/[[...params]]/route.ts` | Keystatic API routes |
| `keystatic.ts` | `/src/lib/keystatic.ts` | Storage mode detection |

### Why Keystatic was replaced

- Custom CMS (`/admin`) provides direct GitHub API integration
- No dependency on `@keystatic/core` package
- Simpler, single-purpose UI for case editing only
- Block-based editor tuned for case study structure

### Restoring Keystatic

1. Copy files back to original locations
2. Restore `src/lib/keystatic.ts` import in components
3. Re-add Keystatic route checks in `ClientProviders.tsx`, `Layout.tsx`, `ThemeToggle.tsx`
4. Update `middleware.ts` to use `CMS_*` env vars exclusively
5. Install dependencies: `npm install @keystatic/core @keystatic/next`

---

*Last updated: 2026-04-12*
