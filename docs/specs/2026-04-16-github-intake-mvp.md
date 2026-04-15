# GitHub -> CMS Intake MVP

Date: 2026-04-16  
Branch: `codex/v2-roadmap-cms-ai`

## Goal

Generate an editable case-study draft in CMS from a GitHub repository URL, especially for AI projects that do not have Figma artifacts.

## Scope (MVP)

Input:
- GitHub repository URL
- Focus angle: `ux-driven` | `behavioral-model` | `agentic-flow`

Output:
- Draft case JSON mapped into CMS structure:
  - Context
  - Problem
  - Constraints
  - Role
  - Approach
  - Solution
  - Outcome
- Evidence links (repo + selected PR/issue URLs)
- Route candidates discovered from `app/**/page.*` or `src/app/**/page.*`
- Runtime screenshot plan (if runtime base URL is provided)

Out of scope:
- Auto-publish
- Perfect semantic accuracy without human review
- Full screenshot crawler and Storybook extraction (next phase)

## Architecture

1. `POST /api/intake/github`
   - validates repository URL
   - fetches repository data through GitHub API
   - returns generated draft + evidence links

2. `POST /api/intake/github/runtime-import`
   - takes screenshot plan + case slug
   - downloads remote screenshot images
   - stores screenshots into `public/cases/<slug>/...` through GitHub API
   - returns imported/failed items for UI reconciliation

3. `src/lib/github-case-intake.ts`
   - URL parsing
   - repository signal fetching (README, merged PRs, closed issues)
   - heuristic mapping into case schema
   - route extraction from repository tree
   - runtime screenshot URL planning

4. Admin UI integration
   - new AI intake block
   - draft generation trigger
   - user confirmation before replacing current form data
   - evidence list for transparency
   - route and screenshot-plan preview
   - import action to convert planned runtime screenshots into local case assets

## Data Sources (MVP)

- Repository metadata (`/repos/{owner}/{repo}`)
- README (`/repos/{owner}/{repo}/readme`)
- Closed merged PRs (`/pulls`)
- Closed issues (`/issues`, excluding PR entries)

## Safety & Reliability

- Draft-only behavior (manual review before save)
- Clear error propagation for invalid URL / GitHub failures
- Evidence links exposed in UI for human verification
- Existing local draft behavior retained

## Limitations

- Heuristic extraction may miss nuanced design decisions
- Repository text quality strongly affects output quality
- No automatic screenshots from runtime UI yet
- Runtime import relies on external screenshot provider availability and remote URL reachability.

## Next Iterations

1. Add runtime screenshot capture for key routes.
2. Add commit-to-feature clustering to isolate UX-impacting changes.
3. Add confidence scoring per generated section.
4. Add “quality gate” checklist before save.
