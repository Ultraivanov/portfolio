# Assistant Workflow (local)

This project uses the `assistant-workflow-starter` structure for deterministic, file-first work.

## Workflow state
- `.assistant/PHASES.md`
- `.assistant/blocks/*.md`
- `.assistant/SNAPSHOT.md`
- `.assistant/BACKLOG.md`
- `.assistant/ARCHITECTURE.md`

## Core commands
- `start` — load context and current task
- `init-phases` — initialize phases for the project
- `init-block <ID>` — create a block file
- `init-task` — create a change plan for the next task
- `/fi` — finish protocol (final checks + summary)

## Agent skills pack (code + design review)
Imported from `agent-skills` into `.assistant/agent-skills/`.

Primary reviewers:
- Code review: `.assistant/agent-skills/agents/code-reviewer.md`
- QA: `.assistant/agent-skills/agents/test-engineer.md`
- Security: `.assistant/agent-skills/agents/security-auditor.md`

Design/UI review skill:
- `.assistant/agent-skills/skills/frontend-ui-engineering/SKILL.md`

Use these for systematic reviews before shipping UI changes.
