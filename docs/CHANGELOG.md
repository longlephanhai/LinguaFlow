# CHANGELOG.md — LinguaFlow

## Unreleased

- Done: `feat(writing)` — Implemented AI Writing Review & Guided Practice full-stack feature (P1): Backend `WritingModule` with `reviewWriting` in `AiModule` (`GeminiProvider`), structured feedback and actionable suggestions, word count calculation, user vocabulary integration with `GET /writing/suggested-words`, `writingReviews` Mongoose schema with soft deletes, paginated history (`GET /writing/history`), review details (`GET /writing/history/:id`), soft deletion (`DELETE /writing/history/:id`), unit tests, and e2e test suite (`backend/src/modules/writing/`, `backend/test/writing.e2e-spec.ts`, `docs/API-CONTRACTS.md`); Frontend `writingApi`, upgraded responsive `WritingPage` with curated writing prompts categorized by proficiency level (Beginner A1-A2, Intermediate B1-B2, Advanced C1), guiding questions accordion, 1-click sentence starter injection, personalized vocabulary target challenge with clickable word chips from user's bank, browse prompts modal, random prompt shuffle ("Surprise Me"), real-time character (20–5000) & word counters, slide-out history drawer, route registration at `/writing`, and unit tests (`frontend/src/pages/WritingPage.tsx`, `frontend/src/data/writing-prompts.ts`, `frontend/src/lib/writing.api.ts`, `frontend/src/pages/WritingPage.test.tsx`, `frontend/src/App.tsx`).
- Done: `feat(chat)` — Implemented AI Chat full-stack feature (P1): Backend `ChatModule` with conversational Gemini AI tutor integration in `AiModule` (`GeminiProvider`), soft-delete session management, 200-message cap per session, 5000-character response truncation safety (EDGE-012), vocabulary chip suggestions (`GET /chat/suggested-words`), unit test suite and e2e test suite (`backend/src/modules/chat/`, `backend/test/chat.e2e-spec.ts`, `docs/API-CONTRACTS.md`); Frontend `chatApi`, modern responsive `ChatPage` with collapsible conversation session history sidebar, natural dialogue stream with inline grammar correction & vocabulary reinforcement, interactive clickable vocabulary chips to inject saved words at cursor position (FR-CHAT-002), and unit tests (`frontend/src/pages/ChatPage.tsx`, `frontend/src/lib/chat.api.ts`, `frontend/src/pages/ChatPage.test.tsx`, `frontend/src/App.tsx`).
- Done: `feat(dashboard)` — Implemented Dashboard Stats full-stack feature (P1): Backend `DashboardModule` with `GET /dashboard/stats` aggregating due review cards, total saved words, total reviews, today reviewed count, streak calculation, 7-day study activity, recent completed quizzes, and recent activities (`backend/src/modules/dashboard/`, `backend/src/app.module.ts`, `docs/API-CONTRACTS.md`); Frontend `dashboardApi`, connected `DashboardPage` with real metrics, daily review goal progress bar, 7-day visual heatmap/breakdown, recent timeline, new user onboarding banner (EDGE-008), and navigation due badge on AppLayout (FR-DASH-001 AC-2) with full test suites (`frontend/src/pages/DashboardPage.tsx`, `frontend/src/pages/DashboardPage.test.tsx`, `frontend/src/components/layout/AppLayout.tsx`, `frontend/src/lib/dashboard.api.ts`).
- Done: `feat(quiz)` — Implemented AI Multiple-Choice Quiz full-stack feature (P1): Backend `QuizModule` with `generateQuiz` in `AiModule` (`GeminiProvider`), 4-option question snapshot generation, immediate answer evaluation with rationale, score tracking, `quizzes` and `quizResults` Mongoose schemas, unit and e2e test suites (`backend/src/modules/quiz/`, `backend/test/quiz.e2e-spec.ts`); Frontend `QuizPage` with scope & count setup, interactive question progress, instant option feedback (green/red + explanation), completion score screen, history modal, and unit tests (`frontend/src/pages/QuizPage.tsx`, `frontend/src/lib/quiz.api.ts`, `frontend/src/pages/QuizPage.test.tsx`).
- Done: `feat(extension)` — Initialized Manifest V3 Chrome Extension with in-context text selection detection, privacy boundary sentence extraction, floating explanation popup with AI in-context definitions using safe DOM APIs (no innerHTML), 1-click save to vocabulary bank, background service worker with silent auth refresh and chrome.storage.local sync, popup management UI, and unit test suite (`extension/`).
- Done: `feat(backend)` — Implemented `AiModule` with provider-agnostic `AIProvider` interface, resilient `GeminiProvider` (@google/genai) featuring `gemini-flash-lite-latest` priority and multi-model failover, SHA-256 `aiCache` collection with 7-day TTL index, updated `AllExceptionsFilter` error unwrapping, and `POST /vocabulary/lookup` endpoint with unit and e2e test suites (`backend/src/modules/ai/`, `backend/src/modules/vocabulary/`).
- Done: `feat(frontend)` — Connected `FlashcardPage` with real Review API, progressive reveal with sentence context highlighting, SM-2 feedback, card suspension, session completion screen, and unit tests (`frontend/src/pages/FlashcardPage.tsx`, `frontend/src/lib/review.api.ts`, `frontend/src/pages/FlashcardPage.test.tsx`).
- Done: `feat(backend)` — Implemented `ReviewModule` with simplified SM-2 algorithm scheduler (`srs.scheduler.ts`), `GET /review/due`, `POST /review/:occurrenceId/result`, `PATCH /review/:occurrenceId/suspend`, unit tests, and e2e test suite (`backend/src/modules/review/`, `app.module.ts`, `backend/test/review.e2e-spec.ts`).
- Done: `feat(frontend)` — Integrated `VocabularyPage` with real backend API, added modal for creating new vocabulary occurrences, drawer for inspecting context occurrences & meanings, search, pagination, and delete handling (`frontend/src/pages/VocabularyPage.tsx`, `frontend/src/lib/vocabulary.api.ts`).
- Done: `feat(backend)` — Implemented `VocabularyModule` enforcing 3-layer architecture (`VocabularyItem` -> `Meaning` -> `Occurrence`), cascading soft deletes, DTOs, unit tests, and e2e test suite (`backend/src/modules/vocabulary/`, `app.module.ts`, `backend/test/vocabulary.e2e-spec.ts`).
- Done: `feat(backend)` — Implemented RBAC Authorization with `RolesModule` and `PermissionsModule`, `RolesGuard`, `PermissionsGuard`, `@Roles` and `@RequirePermissions` decorators, User `roleId` association, unit and e2e test suites, and updated specifications (`DATA-SCHEMA.md`, `API-CONTRACTS.md`, `ARCHITECTURE.md`).
- Done: `feat(frontend)` — Integrated Auth flow with Axios interceptor (silent refresh), AuthProvider context, ProtectedRoute, real API binding on LoginPage and RegisterPage, user info display and logout action on AppLayout (`frontend/src/lib/`, `LoginPage.tsx`, `RegisterPage.tsx`, `AppLayout.tsx`, `App.tsx`).
- Done: `feat(backend)` — Implemented Auth module with register, login, refresh, logout, me endpoints, bcrypt password hashing, dual JWT tokens, JwtAuthGuard, unit tests, and e2e tests (`backend/src/modules/auth/`, `app.module.ts`, `backend/test/auth.e2e-spec.ts`).
- Done: `chore(agents)` — Updated `write-test` skill to Vitest, updated pre-commit workflow to run both FE & BE tests via explicit `--prefix` commands (`.agents/skills/write-test/SKILL.md`, `.agents/workflows/pre-commit.md`).
- Done: `feat(backend)` — Implemented Users module with User schema, DTO validation, service, controller, and unit tests (`backend/src/modules/users/`, `app.module.ts`, `API-CONTRACTS.md`).

- Done: `feat(frontend)` — Configured Vitest, React Testing Library, and added sample unit test (`package.json`, `vite.config.ts`, `setupTests.ts`, `App.test.tsx`).
- Done: `feat(backend)` — Configured global TransformInterceptor, AllExceptionsFilter, and ResponseMessage decorator compliant with API contract envelope (`backend/src/core/`, `backend/src/main.ts`).
- Done: `chore(backend)` — Created `modules/` directory in backend `src` and updated architecture layout doc (`backend/src/modules/`, `ARCHITECTURE.md`).
- Done: `feat(backend)` — Configured Mongoose with `@nestjs/mongoose` and `@nestjs/config` using `MONGODB_URI` (`app.module.ts`, `package.json`).
- Done: `chore(backend)` — Initialized NestJS backend project with ESM and Vitest, added `.env`, `.env.example`, `.gitignore`, and `npm run dev` script (`backend/`).
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
- Automated e2e test baseline established with Auth module (`backend/test/auth.e2e-spec.ts`); expanding to upcoming domain modules as they are developed.
