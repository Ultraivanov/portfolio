# AGENTS.md — Portfolio Project Rules

## Project goal

Build a minimal, product-oriented portfolio for a Product Designer.

Target:
- Russian-speaking product teams
- global market companies
- product + engineering environments

---

## Core principles

1. Product-first, not visual-first
- Prioritize structure, clarity, and logic over decoration
- Every page must communicate decisions, not just visuals

2. Minimal / brutalist direction
- No unnecessary decoration
- No trendy UI patterns (gradients, glass, blobs)
- Strong typography and spacing
- Clear hierarchy

3. Content-driven architecture
- Content is source of truth
- Avoid hardcoding large text blocks in components
- Use structured data for cases

---

## Tech stack
- Next.js (App Router)
- TypeScript
- React
- Gravity UI UIKit (@gravity-ui/uikit)

---

## UI rules

Use Gravity UI as base
- Buttons
- Inputs
- Tabs if needed
- ThemeProvider

Customize visually
- Do NOT use default styles blindly
- Keep UI restrained and product-like
- Prefer borders over shadows
- Use limited color palette

---

## Layout rules

Desktop
- Max width: ~1200px
- Left-aligned content
- Strong vertical rhythm

Mobile
- Single column
- Reduce density
- Maintain hierarchy via spacing

---

## Components rules
- Small, composable components
- No large monolithic components
- Each component must support:
- default state
- responsive behavior
- long content

---

## Content structure

All case studies must follow:
- context
- problem
- constraints
- role
- approach
- solution
- outcome

---

## Code rules
- Strict TypeScript types
- No unnecessary dependencies
- Reusable utilities in /lib
- Keep components clean and readable

---

## What NOT to do
- No over-animation
- No “design portfolio template” look
- No marketing fluff
- No duplicated components
- No inconsistent spacing

---

## Workflow rules
- Build step-by-step
- Do not jump ahead
- Validate each page before moving on

---

## Priority order
1. Layout foundation
2. Homepage
3. Case template
4. Content integration
5. Other pages

---

## Definition of success
- Looks like a real product designer, not a visual designer
- Feels structured and intentional
- Easy to scan and read
- Works equally well on desktop and mobile
