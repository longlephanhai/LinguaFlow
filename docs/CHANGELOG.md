# CHANGELOG.md — LinguaFlow

## v0.2 — Architecture & technical design complete

- Done: `ARCHITECTURE.md` — monolith NestJS backend, monorepo layout, JWT auth shared Web/Extension, contextual-capture data flow, provider-agnostic AI layer, caching/rate-limiting strategy, Extension privacy boundary enforced at architecture level.
- Done: SRS algorithm decided — simplified SM-2 (§9 of ARCHITECTURE.md). Previously deferred open decision, now resolved.
- Done: `DATA-SCHEMA.md` — full Mongoose collections (users, vocabularyItems, meanings, occurrences, quizzes, quizResults, chatSessions, writingReviews, aiCache).
- Done: `API-CONTRACTS.md` — full REST contract for auth, vocabulary, review, quiz, chat, writing, dashboard, with response envelope and error codes.
- Done: `PROJECT-RULES.md` — security, Manifest V3, data model, AI layer, coding style, workflow, and testing rules.
- Done: `UI-DESIGN.md` — lightweight functional layout notes per screen (no Figma yet).
- Doc-generation context locked: English, concise/bullet points, audience = developers + AI coding assistants, stack React+TS / NestJS+TS / MongoDB, team size 1, Monolith.

## v0.1 — Docs redo (merged old file structure)

- Done: `PRD.md` — Problem, Core Features MVP (Extension capture, Vocabulary, Flashcard Review, AI Quiz, AI Chat & Writing Review, Dashboard, Auth/Settings), Out of Scope, User Flow, Constraints, Tech Stack, Open Decisions.
- Scope change ghi nhận: "AI conversation" chuyển từ Non-Goal (PRD cũ) sang Core Feature MVP (AI Chat & Writing Review).

## Still Open

- Exact rate-limit numbers per endpoint — tune after observing real Gemini usage/cost.
- Extension supported-sites scope (all websites vs. allowlist) — MVP assumes all websites.
- No automated e2e tests written yet (rules defined in `PROJECT-RULES.md`, implementation pending).
