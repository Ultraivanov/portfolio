# Protocol: init-phases

Activated by the `init-phases` command.
Goal: analyze context, infer phase structure, generate a draft `PHASES.md`, present for approval.

---

## Step 1 — Context Scan

Read all available artifacts in this order:

1. `.codex/SNAPSHOT.md`
2. `.codex/ARCHITECTURE.md`
3. `.codex/BACKLOG.md`
4. Chat history of the current session

Extract:
- Project type
- Current maturity
- Core user flow
- Known constraints

If critical information is missing, ask **one** focused question.

---

## Step 2 — Phase Structure Inference

Default: **MVP → Alpha → Beta → Release**

Adjust if needed:
- Content project → Draft → Review → Polish → Publish
- Internal tool → MVP → Pilot → Stable

For each phase:
- One-sentence goal
- 3–6 blocks
- Definition of Done per block

---

## Step 3 — Draft Generation

Generate `PHASES.md` with:
- Active Phase = first phase
- Active Block = first block
- All blocks with status `pending`

---

## Step 4 — Present for Approval

Output the full `PHASES.md` draft, then:

```
---
📋 Draft PHASES.md ready.

Approve as-is → `approve`
Request changes → describe changes
Cancel → `cancel`
```

---

## Step 5 — On Approval

When user responds `approve`:

1. Write `PHASES.md`
2. Confirm: `✓ PHASES.md saved. Active block: <Block ID> — <Block title>.`
3. Ask: `Ready to start the first block?`

---

## Constraints

- Never write to `.codex/PHASES.md` before approval.
- Never ask more than one clarifying question.
