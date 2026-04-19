# Backlog

## CMS content stability
- [x] Add optimistic locking in UI (`baseSha`) for save-content to reduce manual conflict retries.
- [x] Add audit log for content edits (who/what/when, path + commit SHA + result).
- [x] Add E2E smoke flow: upload media -> optimize SVG -> save content -> reload admin.
- [x] Harden upload path policy for media writes.
- [x] Add orphan cleanup for partial failures in upload/save flows.
- [x] Extend retry/backoff handling with `Retry-After` support for rate limits.
- [x] Add malicious/edge SVG fixtures (broken encoding, heavy path count, unsafe tags, data URI overload).
- [x] Add race-condition tests for concurrent save requests.

## Admin UX cleanup
- [x] Remove legacy media `variant` model (`diagram/phone/desktop`) from save-content pipeline.
- [ ] Remove old iframe/embed assumptions from content schema and admin UI.
- [ ] Remove variant dropdown from any remaining admin surface; keep media block focused on image upload + path + alt + caption.
- [ ] Migrate existing content entries with `variant`/`FIGMA_EMBED_*` placeholders to the current media model.

## Existing lint debt
- [ ] Main admin has pre-existing lint errors outside the stability scope; global eslint for this file remains red and should be cleaned separately.
