# Snapshot — Assistant Workflow Starter

Date: 2026-04-04

## Summary

Built an assistant-agnostic workflow starter based on the Codex project and extracted the 4-level model (Phase → Block → Task → Session) into a standalone, private repo.

## Key Outcomes

- Private repo created: `Ultraivanov/assistant-workflow-starter`.
- State directory renamed from `.codex/` to `.assistant/` across all docs and scripts.
- Workflow files added: `PHASES.md`, block template, protocols, and init commands.
- Adapters introduced: `AGENTS.md` (Codex) and `CLAUDE.md` (Claude Code) + `ADAPTERS.md`.
- Docs updated: README (EN/RU), CHANGELOG, Obsidian vault synchronized with the 4-level model.

## Structure Highlights

- `.assistant/PHASES.md` — phase/block status
- `.assistant/blocks/BLOCK-TEMPLATE.md` — block/task template
- `.assistant/protocols/*` — phase/block/task protocols
- `.assistant/commands/*` — init commands

## Open Items

- None. Optional next steps: add migration note or script for existing `.codex/` projects.
