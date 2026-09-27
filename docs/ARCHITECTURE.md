# ARCHITECTURE.md — LinguaFlow

> LinguaFlow is an AI-assisted English vocabulary learning system consisting of a Chrome Extension (contextual word capture) and a Web app (spaced review, AI-generated quizzes, AI chat/writing practice), built on Gemini API.

## 1. High-Level Architecture

**Pattern: Monolith.** One NestJS backend service serves both the Web app and the Extension. No microservices/serverless split — appropriate for team size 1 and MVP stage. Revisit only if a single module (e.g., AI usage) needs independent scaling.

```
┌─────────────┐      ┌──────────────┐
│  Web (React) │─────▶│              │
└─────────────┘      │   NestJS     │──────▶ MongoDB (Mongoose)
┌─────────────┐      │  Monolith    │
│ Extension    │─────▶│   (REST)     │──────▶ Gemini API (via AiModule)
│ (CRXJS)      │      └──────────────┘
└─────────────┘
```

- **Web** and **Extension** are two independent frontend clients calling the **same REST API**. Neither talks to MongoDB or Gemini directly.
- **NestJS backend** is the single source of truth for auth, data, and AI orchestration.
- **Gemini** is never called from the frontend — API key must never ship to a browser context (Extension or Web).

## 2. Component Map

| Component | Responsibility |
|---|---|
| `frontend/` (React + TS + Vite) | SPA: Dashboard, Vocabulary Manager, Flashcard Review, Quiz, AI Chat, Writing Review, Settings |
| `extension/` (CRXJS: React + TS + Vite, Manifest V3) | `content script`: detects text selection, shows inline popup UI. `background` (service worker): holds auth token, proxies API calls. `popup`: extension toolbar icon UI (quick vocabulary list / login) |
| `backend/` (NestJS + TS) | REST API. Modules: `AuthModule`, `VocabularyModule`, `ReviewModule`, `QuizModule`, `ChatModule`, `WritingModule`, `DashboardModule`, `AiModule` |
| MongoDB | Persistence — see `DATA-SCHEMA.md` |
| Gemini API | Called only through `AiModule` — never imported directly in other modules |

## 3. Repository Layout

Flat structure — 3 independent apps at the root level, each with its own `package.json`, `tsconfig.json`, and dependency management. No workspace orchestrator (no Turborepo/Nx/Lerna). Each app manages its own TypeScript types and DTOs internally.

```
linguaflow/
├── backend/             # NestJS — standalone Node project
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── auth/
│       ├── vocabulary/
│       ├── review/
│       ├── quiz/
│       ├── chat/
│       ├── writing/
│       ├── dashboard/
│       └── ai/              # AiModule — Gemini wrapper, provider-agnostic
├── frontend/            # React + Vite — standalone Node project
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
├── extension/           # CRXJS (React + Vite, Manifest V3) — standalone Node project
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── content/         # content script (selection listener + popup UI)
│       ├── background/      # service worker
│       └── popup/           # toolbar popup
└── docs/
```

> **Type sharing strategy:** Each app defines its own request/response types matching `API-CONTRACTS.md`. If a DTO drifts, the API contract doc is the single source of truth — not a shared package.

## 4. Auth Flow (shared between Web and Extension)

- **Mechanism: JWT bearer token.** Chosen over cookie-session because the Extension calls the API from a `chrome-extension://` origin — cookies don't work reliably cross-origin for MV3 service workers.
- `POST /auth/login` → returns `{ accessToken, refreshToken, user }`.
- **Web** stores `accessToken` in memory (React state/context) + `refreshToken` in `httpOnly` cookie if same-domain deployment is possible, otherwise `localStorage` as MVP fallback.
- **Extension** stores both tokens in `chrome.storage.local` (not `localStorage` — not available in service workers).
- All API requests: `Authorization: Bearer <accessToken>` header.
- `accessToken` short-lived (e.g., 15 min); `POST /auth/refresh` issues a new one using `refreshToken`.
- Extension `background` service worker owns token refresh; `content` script requests the token from `background` via `chrome.runtime.sendMessage`.

## 5. Data Flow — Contextual Capture (core loop)

1. User selects text on any webpage → `content script` captures `selectedText` + minimum surrounding context (see §8).
2. `content script` → `background` → `POST /vocabulary/lookup { selectedText, contextText, sourceUrl }`.
3. `VocabularyController` → `AiModule.explainInContext()` → Gemini → `{ meaning, example }`.
4. Response is cached (see §7) and returned to the Extension popup UI.
5. User clicks Save → `POST /vocabulary/occurrences` → backend resolves/creates `vocabularyItem` → `meaning` → `occurrence` (see `DATA-SCHEMA.md` — never flattened).

## 6. AI Layer — Provider-Agnostic by Design

- `AiModule` exposes an interface, e.g.:
  ```ts
  interface AIProvider {
    explainInContext(selectedText: string, contextText: string): Promise<{ meaning: string; example: string }>;
    generateQuiz(occurrences: OccurrenceDto[], count: number): Promise<QuizQuestionDto[]>;
    chat(history: ChatMessageDto[], message: string): Promise<string>;
    reviewWriting(text: string): Promise<{ feedback: string; suggestions: string[] }>;
  }
  ```
- `GeminiProvider implements AIProvider` is the only place the Gemini SDK is imported.
- No other module (Vocabulary, Quiz, Chat, Writing) may import the Gemini SDK directly — enforced in `PROJECT-RULES.md`.
- Swapping providers later = writing a new class implementing `AIProvider`, no changes elsewhere.

## 7. Caching & Rate-Limiting (cost control)

- **Lookup cache:** hash `(selectedText + contextText)` → cache Gemini response for repeated lookups of the same occurrence (e.g., MongoDB collection `aiCache` with TTL index, 7 days). Avoids paying Gemini twice for the same sentence.
- **Rate limiting:** NestJS `@nestjs/throttler` per-user limits on cost-heavy endpoints:
  - `/vocabulary/lookup`: e.g., 100/day
  - `/quiz/generate`: e.g., 10/day
  - `/chat/message`: e.g., 50/day
- Exact numbers are configurable via env vars — tune after observing real Gemini cost.

## 8. Extension Privacy Boundary (enforced at architecture level)

- `content script` only activates on the browser's native `selectionchange`/`mouseup` event with non-empty selection — **never** on page load or scroll.
- Context capture = selected text + immediate parent element's text (or N characters before/after) — **never** `document.body.innerText` or full DOM serialization.
- This boundary is a hard constraint from `PRD.md` — any implementation that reads the full page must be rejected in review.

## 9. Review Scheduling Algorithm (decision made at this phase)

- **Algorithm: simplified SM-2** (SuperMemo-2), same family used by Anki — well-documented, easy to implement, good enough for MVP (no need to design a custom algorithm).
- Stored per `occurrence`: `easeFactor` (default 2.5), `intervalDays`, `repetitions`, `dueDate`.
- On review result (`remembered: boolean`):
  - If `remembered = false`: `repetitions = 0`, `intervalDays = 1`.
  - If `remembered = true`: `repetitions += 1`; `intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 6 : round(intervalDays * easeFactor)`; `easeFactor` adjusted slightly upward (min 1.3).
- `dueDate = today + intervalDays`. `GET /review/due` queries `occurrences` where `dueDate <= now`.
- This lives in `ReviewModule`, pure TypeScript function (no AI involved) — fully unit-testable.

## 10. Open Items Resolved at This Phase

- ✅ SRS algorithm → simplified SM-2 (§9)
- ✅ Auth mechanism → JWT bearer, shared Web/Extension (§4)
- ✅ Repo structure → flat sibling directories (§3)
- ⬜ Still open: exact rate-limit numbers (tune post-launch), whitelisted vs. all websites for Extension (deferred — MVP assumes all websites).
