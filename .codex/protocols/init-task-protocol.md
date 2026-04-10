# Protocol: init-task

Activated by the `init-task` command.
Goal: select the next task, write a change plan, and get approval.

---

## Step 1 — Context Scan

Read:
- `.codex/PHASES.md`
- Active block file in `.codex/blocks/<ID>.md`
- `.codex/SNAPSHOT.md`

Identify:
- Active task or next pending task
- Done When condition
- Constraints and risk factors

---

## Step 2 — Change Plan Draft

Add a new Change Plan entry to the active block file:

- Files to modify
- Files to create
- Files NOT touched
- Approach
- Risks

Keep it concise and verifiable.

---

## Step 3 — Present for Approval

Output the Change Plan in a code block, then:

```
---
Approve change plan → `yes`
Request changes → describe changes
Cancel → `cancel`
```

---

## Step 4 — On Approval

When user responds `yes`:

1. Update the block file with the approved Change Plan
2. Set task status to `in-progress`
3. Proceed to implementation

---

## Constraints

- One task per session.
- No code is written before approval.
