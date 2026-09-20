# CHANGELOG.md — LinguaFlow

## v0.3 — Monorepo skeleton initialized (branch: `task/01-monnorepo-skeleton`)

- Done: Root `package.json` — pnpm workspaces (`apps/*`, `packages/*`), scripts: `dev`, `build`, `lint`, `test`, `test:e2e`.
- Done: `pnpm-workspace.yaml` — workspace root declaration.
- Done: `tsconfig.base.json` — strict TS, ES2022, path alias `@linguaflow/shared-types`.
- Done: `.gitignore` — covers `node_modules/`, `dist/`, `.env*`, `*.tsbuildinfo`, `dist-extension/`, etc.
- Done: `packages/shared-types/` — placeholder DTO interfaces for auth, vocabulary (3-layer), review (SM-2), quiz, chat, writing, ai (`AI_PROVIDER_ERROR` const). No external deps.
- Done: `apps/backend/` — NestJS skeleton: `main.ts` (global ValidationPipe), `app.module.ts` (ConfigModule, MongooseModule, ThrottlerModule), 8 module stubs (`auth`, `vocabulary`, `review`, `quiz`, `chat`, `writing`, `dashboard`, `ai`). Each stub: `module.ts`, `controller.ts`, `service.ts`. `AiModule` is the only module that will import the Gemini SDK.
- Done: `apps/web/` — React + Vite skeleton: `vite.config.ts` (shared-types alias, /api proxy), `index.html`, `src/main.tsx`, `src/App.tsx`.
- Done: `apps/extension/` — CRXJS (React + Vite, MV3) skeleton: `manifest.json` (MV3 only), `vite.config.ts`, `src/content/index.ts`, `src/background/index.ts`, `src/popup/Popup.tsx`. Privacy rules + auth-token rules embedded as comments.
- Done: `pnpm install` — 710 packages resolved, all workspaces linked, `pnpm-lock.yaml` generated.

## Still Open (carried forward)

- Exact rate-limit numbers per endpoint — tune after observing real Gemini usage/cost.
- Extension supported-sites scope — MVP assumes all websites.
- No automated e2e tests yet (rules defined in `PROJECT-RULES.md`, implementation pending).

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
