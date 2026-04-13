# CMS Hardening + Refactor Plan

Date: 2026-04-13
Branch: `codex/cms-hardening-refactor`
Status: in progress

## Goals
- Make CMS stable under real editing load.
- Prevent invalid content writes and path abuse.
- Reduce maintenance cost by splitting monolithic admin code.
- Improve content loading and rendering behavior for speed and reliability.

## Scope
1. CMS reliability and data safety
2. Code refactor and architecture cleanup
3. Performance and content loading optimizations

## Work Plan

### Phase 1 (P0): CMS Contract and Write Safety
- Add strict server-side validation for case payloads.
- Enforce path allowlist for save/upload endpoints.
- Centralize GitHub write calls with retry, timeout, and normalized errors.
- Add conflict-aware behavior (`sha` based updates).

Done when:
- Invalid payloads cannot be committed through API.
- Invalid paths are rejected deterministically.
- API error codes are stable and user-facing errors are clear.

### Phase 2 (P0/P1): Admin Decomposition
- Split `src/app/admin/page.tsx` into composable editors.
- Extract data and side-effect logic into hooks.
- Keep behavior parity, then simplify.

Done when:
- Admin page no longer has monolithic business logic.
- Component boundaries are explicit and testable.

### Phase 3 (P0): Rendering Correctness
- Remove unsafe fallback for unknown case slugs.
- Return proper 404 (`notFound`) for missing slugs.
- Keep ISR behavior predictable for published content.

Done when:
- Unknown slug does not silently render unrelated case.

### Phase 4 (P1): Content Loading and Performance
- Move repeated content read logic to shared loader helpers.
- Remove sync I/O from hot paths where possible.
- Optimize media rendering strategy and preserve mobile behavior.

Done when:
- Content loading path is centralized and measurable.
- No performance regression on homepage/case pages.

## Test Strategy

### Unit
- Case payload validation (facts, sections, block discriminants).
- Path sanitization and allowlist guards.
- GitHub error mapping and retry policy behavior.

### API Integration
- `POST /api/save-content`: success, validation fail, conflict, rate limit.
- `POST /api/upload-image`: success, mime/type/path/size failures.
- `GET /api/cases` and `GET /api/cases/[slug]`: valid + not found.

### E2E (Playwright, planned)
- Open admin, edit case, save, confirm success state.
- Upload media image to block and verify path update.
- Simulate concurrent edits and verify conflict messaging.

### Regression
- Existing Jest suite must remain green.
- Add smoke tests for case page rendering by slug.
- Verify `/work/[slug]` 404 behavior.

## Risk Controls
- Draft PR only until P0 hardening tests pass.
- Keep changes incremental in small commits.
- No force-push on shared branches.
- No direct edits on `main`.
