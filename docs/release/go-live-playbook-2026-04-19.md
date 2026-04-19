# Go-Live Playbook (R-03-T3)

Date: 2026-04-19  
Branch: `codex/v2-roadmap-cms-ai`  
Related docs:
- `docs/release/launch-checklist.md`
- `docs/release/launch-readiness-2026-04-19.md`

## Roles

| Role | Responsibility |
|---|---|
| Release Operator | Runs commands, verifies gate evidence, executes deploy/rollback actions |
| Engineering Owner | Technical approval, incident triage owner, rollback authority |
| Product Owner | Final GO/NO-GO business decision and release communications |

## Preconditions (Must Be True Before GO)

1. All required env vars are set in release environment:
   - `GITHUB_PAT`
   - `GITHUB_REPO`
   - `CMS_ADMIN_USER`
   - `CMS_ADMIN_PASSWORD`
2. Gates G1-G5 are PASS.
3. G7 runtime walkthrough evidence is recorded.
4. Rollback metadata is filled (owner + last known good deployment URL).

## Execution Timeline

### T-60 min: Freeze + Baseline

1. Confirm release candidate commit SHA.
2. Run:
   - `npm run lint`
   - `npm run build`
   - targeted `npm test -- ...` from launch checklist
3. Save command output and timestamp in the readiness report.

### T-30 min: Runtime Sanity

1. Manual walkthrough on release deployment:
   - `/`
   - `/work`
   - `/work/[slug]` (at least 2 cases)
   - `/admin` login + read sanity
2. Record outcome as PASS/FAIL with notes.

### T-15 min: Final Gate Review

1. Release Operator presents G1-G8 table.
2. Engineering Owner confirms technical readiness.
3. Product Owner confirms business readiness.
4. Decision:
   - If any gate is FAIL/PENDING: `NO-GO`
   - If all gates PASS: `GO`

### T0: Go-Live

1. Announce start in release channel.
2. Deploy release candidate (platform-specific deploy flow).
3. Re-run smoke checks on deployed URL.
4. Announce completion + deployment URL + commit SHA.

## Rollback Triggers

Trigger rollback immediately when one of these occurs post-deploy:

1. `/admin` cannot authenticate with expected credentials.
2. Content save/upload API fails for valid requests.
3. Public routes return critical errors or blank render.
4. Data integrity regression is detected in production content.

## Rollback Procedure

1. Identify last known good deployment:
   - Commit: `<fill>`
   - URL: `<fill>`
2. Release Operator redeploys last known good commit.
3. Run rollback smoke checks:
   - `/`
   - `/work`
   - `/admin`
4. Engineering Owner confirms stabilization.
5. Announce rollback completion and open follow-up issue.

## Communication Template

### GO
`GO: deploying <sha> to production. Owners: <engineering>, <product>.`

### NO-GO
`NO-GO: release blocked by <gate ids>. Next update at <time>.`

### ROLLBACK
`ROLLBACK: reverted to <sha>/<url> due to <reason>. Stability checks in progress.`

## Completion Record

- Release candidate SHA: `<fill>`
- Deployment URL: `<fill>`
- Final decision: `GO` / `NO-GO`
- Product sign-off: `<name/date>`
- Engineering sign-off: `<name/date>`
