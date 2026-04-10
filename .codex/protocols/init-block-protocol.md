# Protocol: init-block

Activated by the `init-block <ID>` command.
Goal: open a block, define tasks, and create the block file.

---

## Step 1 — Context Scan

Read:
- `.codex/PHASES.md`
- `.codex/SNAPSHOT.md`
- `.codex/ARCHITECTURE.md`
- `.codex/BACKLOG.md`

Identify:
- Current phase and target block
- Known constraints
- Pending tasks relevant to the block

---

## Step 2 — Draft Block File

Use `.codex/blocks/BLOCK-TEMPLATE.md` as the structure.

Fill in:
- Block Goal
- Definition of Done
- 2–3 initial tasks with clear Done When criteria
- Active Task set to first task

---

## Step 3 — Present for Approval

Output the full block file in a code block, then:

```
---
📋 Draft block file ready.

Approve → `approve`
Request changes → describe changes
Cancel → `cancel`
```

---

## Step 4 — On Approval

When user responds `approve`:

1. Write the block file to `.codex/blocks/<ID>.md`
2. Update `.codex/PHASES.md`:
   - set block status to `in-progress`
   - set Active Block fields
3. Confirm: `✓ Block opened: <ID> — <Title>.`

---

## Constraints

- Do not write any files before approval.
- Tasks must be small enough to complete in one session.
