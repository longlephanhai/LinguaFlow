# CHANGELOG.md — LinguaFlow

## Unreleased

- Done: `chore(backend)` — Initialized NestJS backend project with ESM and Vitest, added `.env`, `.env.example`, and `.gitignore` (`backend/`).
- Done: `feat(frontend)` — Added FlashcardPage (Flashcard Review) with progressive reveal, sentence context highlighting, and SM-2 readiness (`FlashcardPage.tsx`, `App.tsx`).
- Done: `feat(frontend)` — Added VocabularyPage (Vocabulary Manager) with search, filter, status tags, table view, and empty states (`VocabularyPage.tsx`, `App.tsx`).
- Done: `feat(frontend)` — Added AppLayout with Mantine AppShell (responsive sidebar & dark mode toggle), DashboardPage, and post-auth redirects (`AppLayout.tsx`, `DashboardPage.tsx`, `App.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`).
- Done: `refactor(frontend)` — Migrated `RegisterPage` to Mantine UI, removed `RegisterPage.css`, and elevated visual quote design on auth pages (`RegisterPage.tsx`, `LoginPage.tsx`).
- Done: `refactor(frontend)` — Migrated `LoginPage` from custom CSS to Mantine UI components (`LoginPage.tsx`, `LoginPage.css`).
- Done: `refactor(frontend)` — Migrated `LandingPage` from custom CSS to Mantine UI components and Tabler icons (`LandingPage.tsx`, `LandingPage.css`).
- Done: `chore(agents)` — Updated `frontend-design` skill with anti-cliché guidelines and token consistency rules (`frontend-design/SKILL.md`).

- Done: `chore(frontend)` — Integrated Mantine UI (v7) with PostCSS configuration and `MantineProvider` setup (`main.tsx`, `postcss.config.cjs`, `package.json`).
- Done: `feat(frontend)` — Added RegisterPage (sign-up) layout with routing support via react-router-dom (`RegisterPage.tsx`, `RegisterPage.css`, `App.tsx`).
- Done: `feat(frontend)` — Added LoginPage layout with routing support via react-router-dom (`LoginPage.tsx`, `LoginPage.css`, `App.tsx`).
- Done: `feat(frontend)` — Initial landing page layout with hero section and interactive contextual AI lookup demo (`LandingPage.tsx`).
- Done: Design tokens and typography setup in `index.css` (Space Grotesk & Inter, color tokens, shadow scales).

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
