# Portfolio V2 Roadmap (CMS + AI Acceleration)

Date: 2026-04-16  
Owner: Dima Ginzburg

## 1) Why V2

Current site is stable in production, but case production is still too manual and slow.  
V2 is a separate delivery track focused on:

- faster case creation
- stronger CMS reliability
- repeatable visual system for engineering-oriented case covers
- AI-assisted intake from multiple sources (not only Figma)

## 2) V2 Delivery Model (Safe Zone)

Recommended setup:

- Git branch family: `codex/v2-*`
- Separate Vercel project for V2 previews (or dedicated V2 environment)
- Optional V2 domain: `v2.ginzburg.work`
- Merge to production only after phased validation

Release rule:

- `main` stays conservative and client-safe
- V2 features land behind flags and are validated in isolated previews first

## 3) Scope of V2

### A. CMS Reliability + Speed

- Modularize admin editor (split monolith editor into smaller blocks/hooks)
- Field-level validation and save-state UX
- Upload preflight + deterministic error feedback
- Local drafts + conflict-safe save flow

### B. Image Preprocessor (Raster + SVG)

Goal: never fail upload because of platform limits unless file is fundamentally invalid.

Pipeline:

1. Client preflight (size/mime/dimensions)
2. Progressive compression loop (quality + resize)
3. Optional WebP conversion
4. Hard stop under configured target bytes
5. Server fallback transform if client side misses target

Output in CMS:

- Before/after size
- Processing status
- Clear reason if rejected

### C. Cover Generator (Blueprint System)

Goal: consistent, engineering-style case covers with low manual effort.

Visual system:

- blueprint base (blue paper, grid, linework)
- strict typography template
- case title + optional short subtitle
- deterministic style variants by case angle:
  - `behavioral-model`
  - `ux-driven`
  - `agentic-flow`

Result:

- repeatable output
- visually coherent library
- quick regeneration when case wording changes

### D. AI Case Intake Assistant

Goal: create high-quality case drafts quickly from real project artifacts.

Primary source adapters:

1. Figma adapter (existing workflow)
2. GitHub adapter (new priority for AI projects)
3. Optional text/doc adapters later (Notion/Docs/Markdown folders)

GitHub adapter extracts:

- README, docs, ADRs
- key PRs, issues, milestones
- architecture signals (modules, services, APIs)
- timeline of decisions and outcomes

Then it generates a CMS draft mapped to containers:

- Context
- Problem
- Constraints
- Role
- Approach
- Solution
- Outcome

Important: draft-only mode by default (human review before save/publish).

## 4) AI Integrations to Accelerate Production

### 4.1 Repo -> Case Draft

- Input: GitHub repo URL
- Output: structured draft + evidence links per section
- Benefit: AI projects without Figma are still fast to convert into portfolio cases

### 4.2 Narrative Gap Detector

- Finds weak or missing sections (e.g. no measurable outcome, unclear constraints)
- Suggests concrete rewrites with confidence score

### 4.3 Artifact-to-Block Auto Mapper

- Maps artifacts to CMS block types automatically:
  - diagrams/images -> media
  - PR/issue references -> link
  - bullet evidence -> list
  - narrative synthesis -> paragraph

### 4.4 Case Consistency QA Bot

- Checks tone, structure, section order, verbosity, and claims vs evidence
- Flags unsupported statements and missing proof

### 4.5 One-Click “Case Starter”

- User submits source URL(s)
- System generates:
  - draft case JSON
  - cover candidate (blueprint mode)
  - suggested title/subtitle variants

## 5) Implementation Phases

## Phase 0 — Foundation (0.5 day)

- Lint/test/build baseline cleanup for V2 branch
- CI gates for V2 branch
- Feature-flag skeleton

Deliverable: reliable engineering baseline for fast iteration.

## Phase 1 — Upload & Preprocessor (1-2 days)

- Add robust raster preprocessor pipeline
- Add preflight checks + user feedback states
- Add tests for oversize/error/timeout cases

Deliverable: upload success rate near 100% for valid inputs.

## Phase 2 — Blueprint Cover Generator (1-2 days)

- Implement generator templates + mode variants
- Add “Generate cover” action in CMS
- Add deterministic naming/storage conventions

Deliverable: repeatable engineering-style covers in minutes.

## Phase 3 — GitHub Intake to Draft (2-4 days)

- Implement GitHub source adapter
- Build draft composer to CMS schema
- Add review/confirm step before save

Deliverable: from repo docs to editable case draft with evidence.

## Phase 4 — CMS UX + Quality Layer (1-2 days)

- Split editor into modules
- Add sticky save bar and inline validation
- Add quality checklist before publish

Deliverable: faster, safer authoring flow with fewer content losses.

## 6) Risks and Controls

Risks:

- AI hallucination in generated case copy
- noisy GitHub sources (incomplete docs)
- visual generator drift from brand system

Controls:

- evidence-linked generation (claim -> source)
- draft-only workflow (human approval required)
- template locking for cover system

## 7) Success Metrics

- Time-to-first-draft per case: target < 30 minutes
- Manual effort reduction per case: target 40-60%
- Upload failure rate for valid files: target < 2%
- Shareable case throughput per month: +2x from current baseline

## 8) Immediate Next Steps

1. Approve V2 scope and phase order
2. Start Phase 0 on `codex/v2-*` branch line
3. Implement Phase 1 (preprocessor) first
4. Parallel-design blueprint cover templates while Phase 1 is in progress
5. Start GitHub adapter as first AI-source expansion

