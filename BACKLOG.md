# Backlog

## CMS content stability
- [x] Add optimistic locking in UI (`baseSha`) for save-content to reduce manual conflict retries.
- [ ] Add audit log for content edits (who/what/when, path + commit SHA + result).
- [ ] Add E2E smoke flow: upload media -> optimize SVG -> save content -> reload admin.
- [ ] Harden upload path policy and orphan cleanup for partial failures.
- [x] Extend retry/backoff handling with `Retry-After` support for rate limits.
- [ ] Add malicious/edge SVG fixtures (broken encoding, heavy path count, unsafe tags, data URI overload).
- [x] Add race-condition tests for concurrent save requests.

## Admin UX cleanup
- [ ] Remove legacy media `variant` model (`diagram/phone/desktop`) and old iframe/embed assumptions from content schema and admin UI.
- [ ] Remove variant dropdown from any remaining admin surface; keep media block focused on image upload + path + alt + caption.
- [ ] Migrate existing content entries with `variant`/`FIGMA_EMBED_*` placeholders to the current media model.

## Existing lint debt
- [ ] Main admin has pre-existing lint errors outside the stability scope; global eslint for this file remains red and should be cleaned separately.
