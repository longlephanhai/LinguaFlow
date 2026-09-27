# PROJECT-RULES.md — LinguaFlow

> Rules the AI coding agent must follow on every task. Read this before writing code.

## Security

- Never hardcode the Gemini API key or any secret — always read via NestJS `ConfigModule` (`process.env.GEMINI_API_KEY`).
- Never log full user text sent to Gemini in production logs (may contain sensitive reading material).
- Always validate request bodies with `class-validator` DTOs — never trust raw `req.body`.
- Never use `eval()` or `innerHTML` in the Extension or Web app.
- Passwords: always hash with `bcrypt` before storing — never store plaintext.

## Manifest V3 (Extension)

- Only use Manifest V3 APIs — never `chrome.browserAction` (MV2) or other deprecated MV2 APIs.
- `content script` must only trigger an AI lookup on an explicit user selection event (`mouseup`/`selectionchange` with non-empty selection) — never on page load, scroll, or a timer.
- Never read or transmit `document.body.innerText` or full-page DOM — only the selected text + minimum surrounding context (see `ARCHITECTURE.md` §8).
- Store auth tokens in `chrome.storage.local`, never `localStorage` (not available in MV3 service workers).

## Data Model

- Always write vocabulary through the full chain: `vocabularyItem → meaning → occurrence`. Never create a flat vocabulary record that skips this structure, even for "quick save" flows.
- `occurrence.sentence` and `occurrence.sourceUrl` must never be overwritten silently — only via explicit user edit (`PATCH /vocabulary/occurrences/:id`).

## AI Layer

- All Gemini calls go through `AiModule`'s `AIProvider` interface (`ARCHITECTURE.md` §6). No other module may import the Gemini SDK directly.
- Every AI call must have a timeout and a fallback error path — never let an unhandled AI failure crash a request; return `AI_PROVIDER_ERROR` (see `API-CONTRACTS.md`).
- Cache lookup results by `hash(selectedText + contextText)` before calling Gemini (see `ARCHITECTURE.md` §7) — check cache first.

## Coding Style

- TypeScript strict mode on all three apps (`backend`, `frontend`, `extension`).
- NestJS: one module per domain (`auth`, `vocabulary`, `review`, `quiz`, `chat`, `writing`, `dashboard`, `ai`) — no cross-module direct DB access; go through the owning module's service.
- React: functional components + hooks only, no class components.
- Naming: files kebab-case (`vocabulary-item.service.ts`), React components PascalCase (`FlashcardReview.tsx`), Mongoose schemas PascalCase with `Schema` suffix (`OccurrenceSchema`).
- Each app (`backend/`, `frontend/`, `extension/`) defines its own DTOs/types matching `API-CONTRACTS.md` — the contract doc is the single source of truth if types drift.

## Workflow

- Before implementing a new feature or endpoint: update `PRD.md` scope, then `DATA-SCHEMA.md`/`API-CONTRACTS.md` if needed — **then** write code.
- After finishing a feature: add an entry to `CHANGELOG.md` (what was done, what's still open).
- Every new API endpoint should have at least one e2e test (NestJS `supertest`) before being considered done, even for a solo project — it's the safety net that lets an AI agent refactor later without silently breaking behavior.

## Testing Baseline

- Unit test the SM-2 scheduling function (`ARCHITECTURE.md` §9) in isolation — it's pure logic, no AI/DB dependency, cheapest to keep correct.
- Mock `AIProvider` in tests for `VocabularyModule`/`QuizModule`/`ChatModule`/`WritingModule` — never call real Gemini API in automated tests.
