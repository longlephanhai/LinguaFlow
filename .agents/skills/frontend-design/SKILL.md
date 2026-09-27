---
name: frontend-design
description: Use when building, styling, or redesigning UI components for Web or Extension to ensure a distinct, non-generic aesthetic.
---

# Frontend Design & Visual Direction

Approach this as an opinionated Design Lead creating a distinct identity. Avoid generic AI templates and cookie-cutter SaaS layouts.

## 1. Eliminate AI-Generated Tells (Banned Defaults)
Do NOT fall back to these generic patterns unless explicitly requested:
- The "Warm Editorial" cliché: Cream background (#F4F1EA) + serif heading + terracotta/clay accent (#D97757).
- The "Cyber Dark" cliché: #0B0B0B background + acid-green or vermilion neon accent.
- The "SaaS Card Kit": Identical rounded-xl cards with ubiquitous faint shadow `rgba(0,0,0,0.1)` and decorative gradient blurs.
- Repetitive micro-decorations: Tracked uppercase eyebrow tags, bullet dots (`A · B · C`), random em-dashes (`WORD — fragment`), or automatic trailing arrows (`→`).
- Single-word color accents in headlines (e.g., highlighting just one word in italics or bright color).

## 2. Typography & Layout Principles
- Use 1 or 2 deliberate font families max.
- Maximum line length under 80 characters for body text.
- Visual structure is data: Only use numbered markers (01, 02) if the content represents a sequential flow.
- Purposeful motion: Avoid entrance animations on every single card. Reserve motion for direct user interaction feedback.

## 3. Copywriting & Microcopy
- Label actions by what they do in plain language ("Save changes", NOT "Submit").
- Keep terminology consistent across flows (Button "Publish" -> Notification "Published").
- Empty states and errors must provide a clear next action, not vague apologies.

## 4. Modern Styling & Architecture Rules
- Token Consistency: Map all colors and spacing to the project's theme system (CSS variables, Tailwind config, or Component Library theme). Do not hardcode arbitrary hex values into component files.
- Composition over Specificity: Avoid complex CSS specificity battles. Use component encapsulation (CSS Modules, Utility classes with `cn()`, or UI library props).
- Dark Mode Native: Always ensure foreground/background contrast meets WCAG AA standards across both light and dark themes.

## 5. Workflow
1. **Plan First:** Propose a 4-6 color palette (mapped to semantic roles), typography choices, and an ASCII layout wireframe.
2. **Self-Critique:** Review if the design looks like a cookie-cutter template. Remove one unnecessary decorative flourish.
3. **Implement:** Write modular, accessible code following the planned structure.