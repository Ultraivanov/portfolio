# Launch Checklist (R-03)

Date: 2026-04-19  
Block: `R-03`  
Owner: Product + Engineering

## Purpose

Provide explicit release gates for production launch so go/no-go decisions are based on verifiable evidence, not assumptions.

## Scope

In scope:
- Portfolio web app runtime (`/`, `/work`, `/work/[slug]`, legal pages, contact/cv)
- CMS authoring flow (`/admin`, `save-content`, `upload-image`, GitHub-backed content writes)
- Content integrity (`src/content/home.json`, `src/content/cases/*.json`)

Out of scope for this checklist:
- New feature development
- Visual redesign iterations that are not blockers
- Experimental non-production scripts and duplicate `* 2.*` artifacts

## Release Gates

All gates below must pass to mark launch as `GO`.

| Gate ID | Gate | Pass Criteria | Evidence |
|---|---|---|---|
| G1 | Build + lint baseline | `npm run lint` and `npm run build` pass on release branch | Command output logs + commit SHA |
| G2 | Test baseline | Targeted critical test suites pass (CMS save/upload/admin smoke + content validation) | Jest output with suite list |
| G3 | CMS write safety | `save-content` optimistic locking and upload path policy remain enforced | Existing API tests + manual API sanity check |
| G4 | CMS smoke flow | Upload media -> save -> reload admin preserves media path and save state | Admin smoke test (`page.test.tsx`) |
| G5 | Content integrity | No legacy `variant` / `FIGMA_EMBED_*` / embed placeholders in content JSON | `content-legacy-migration.test.ts` output |
| G6 | Env + auth readiness | Required env vars are present in release environment and admin auth works | Environment checklist + login sanity |
| G7 | Runtime sanity | Public routes load and key case pages render without critical regressions | Manual browser walkthrough notes |
| G8 | Rollback readiness | Prior known-good deployment and rollback command/owner are documented | Rollback section below completed |

## Required Environment Checklist

- `GITHUB_PAT` configured
- `GITHUB_REPO` configured
- `CMS_ADMIN_USER` configured
- `CMS_ADMIN_PASSWORD` configured

## Pre-Release Command Checklist

Run on the release branch tip:

```bash
npm run lint
npm run build
npm test -- src/app/admin/page.test.tsx \
  src/app/api/save-content/route.test.ts \
  src/app/api/upload-image/route.test.ts \
  src/app/api/upload-image/cleanup/route.test.ts \
  src/lib/__tests__/case-content-validation.test.ts \
  src/lib/__tests__/content-legacy-migration.test.ts
```

## Go/No-Go Protocol

1. Confirm all G1-G8 gates are marked `PASS`.
2. Record release commit SHA and deployment URL.
3. Product owner and engineering owner both confirm `GO`.
4. If any gate fails, mark `NO-GO`, capture blocker, and re-run checklist after fix.

## Rollback Plan (Template)

- Last known good commit: `<sha>`
- Last known good deployment URL: `<url>`
- Rollback owner: `<name>`
- Rollback action:
  1. Redeploy last known good commit
  2. Smoke-check `/`, `/work`, `/admin`
  3. Announce rollback completion
- Post-rollback follow-up ticket: `<link>`

## Sign-Off Record (Template)

- Release candidate SHA: `<sha>`
- Build ID / Deployment URL: `<url>`
- Product sign-off: `<name> / <date>`
- Engineering sign-off: `<name> / <date>`
- Final decision: `GO` / `NO-GO`
