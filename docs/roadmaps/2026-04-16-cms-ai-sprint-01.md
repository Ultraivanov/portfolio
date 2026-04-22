# CMS + AI Sprint 01 (Gap Closure)

Date: 2026-04-16  
Source: `docs/roadmaps/2026-04-16-v2-cms-ai-roadmap.md` (gaps 4.2-4.5)

## Sprint Goal

Close the highest-impact AI quality gaps after GitHub Intake MVP:
- detect weak/missing narrative sections early
- surface quality checks in CMS before save/publish
- improve artifact-to-block mapping reliability

## Scope Boundary

In scope:
- draft quality analysis and visible checklist in `/admin`
- confidence and gap signals for generated drafts
- stronger runtime artifact merge behavior

Out of scope:
- full autonomous publish pipeline
- cover generator implementation
- multi-source adapters beyond GitHub

## Task Breakdown

## S1 — Narrative Gap Detector + Quality Checklist
- Priority: P0
- Status: in-progress
- Deliverables:
  - reusable draft quality analyzer in `src/lib`
  - checklist UI in admin with critical/warning grouping
  - save-time warning when critical sections are missing
- DoD:
  - detects missing required sections (`Context`, `Problem`, `Constraints`, `Role`, `Approach`, `Solution`, `Outcome`)
  - flags weak `Outcome` and `Constraints` narratives
  - unit tests cover positive + negative cases

## S2 — Intake Confidence Signals
- Priority: P0
- Status: planned
- Deliverables:
  - intake response includes structured confidence summary
  - admin UI displays confidence per section
- DoD:
  - confidence object is deterministic and typed
  - UI remains usable in heuristic and LLM modes

## S3 — Artifact-to-Block Auto Mapper Hardening
- Priority: P1
- Status: planned
- Deliverables:
  - safer matching of imported runtime screenshots into `Visual Artifacts`
  - deterministic append order + duplicate prevention
- DoD:
  - repeated imports do not create uncontrolled duplicates
  - tests cover route collisions and missing section fallback

## S4 — Case Consistency QA Bot (Rule-based MVP)
- Priority: P1
- Status: planned
- Deliverables:
  - rule-based consistency checks (tone/verbosity/order/evidence claims)
  - actionable messages grouped by severity
- DoD:
  - clear pass/fail summary in admin
  - unsupported claim warnings reference evidence availability

## S5 — One-Click Case Starter (MVP shell)
- Priority: P2
- Status: planned
- Deliverables:
  - one action to generate draft + proposed title/subtitle variants
  - keeps human confirmation before apply/save
- DoD:
  - no destructive overwrite without explicit user confirm
  - works for both LLM and heuristic analysis modes

## Execution Order
1. S1
2. S2
3. S3
4. S4
5. S5

## Risks and Controls
- Risk: false-positive quality warnings
- Control: deterministic rules + conservative threshold + tests
- Risk: admin noise from too many alerts
- Control: show critical first, collapse informational hints
