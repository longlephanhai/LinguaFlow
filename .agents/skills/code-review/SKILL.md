---
name: code-review
description: Use to review recent code diffs for security, performance, architecture adherence, and bugs before merging or committing.
---

# Code Review Skill

When performing code reviews, work through each checklist in order. Report findings grouped by severity: 🔴 Blocker → 🟠 Major → 🟡 Minor.

## 1. Architecture & Data Integrity

- Verify strict adherence to `@docs/PROJECT-RULES.md` and `@docs/ARCHITECTURE.md`.
- Enforce the 3-layer vocabulary chain: `vocabularyItem → meaning → occurrence` — reject any code that creates a flat vocabulary record that skips this structure.
- Confirm no module outside `AiModule` directly imports or calls the Gemini SDK (`@google/generative-ai` or similar).
- Check that cross-module data access goes through the owning module's service, never via direct DB query from a foreign module.

## 2. API Contract Compliance

Verify every new or modified endpoint against `@docs/API-CONTRACTS.md`:
- Response **always** uses the standard envelope: `{ success: true, data: ... }` on success, `{ success: false, error: { code, message } }` on error.
- Error codes come from the defined list (`VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `RATE_LIMITED`, `AI_PROVIDER_ERROR`) — no ad-hoc string codes.
- DTO request body validation is present (`class-validator` decorators) on all new endpoints — never trust raw `req.body`.
- AI-failure paths return `AI_PROVIDER_ERROR` and **never** let an unhandled rejection crash the request.

## 3. Security & Privacy Boundary

- Check that no API keys or secrets are committed (no hardcoded `GEMINI_API_KEY`, JWT secrets, etc.).
- Confirm Extension `content script` only reads `selectedText` + minimum surrounding context — **never** `document.body.innerText` or full DOM.
- Passwords are always hashed with `bcrypt` — never stored plaintext or logged.
- No `eval()` or `innerHTML` in Web or Extension code.
- Auth tokens in Extension are stored in `chrome.storage.local`, not `localStorage`.

## 4. Manifest V3 Compliance (Extension only)

- No MV2 APIs: `chrome.browserAction`, `chrome.tabs.executeScript` with string, persistent background page.
- Content script activation is **event-driven** (`mouseup`/`selectionchange` with non-empty selection) — never on page load, scroll, or a timer.
- Service worker has no global state that must persist across restarts — use `chrome.storage` for anything that needs to survive.

## 5. Performance & Query Safety

- Check for N+1 query patterns: service methods inside a loop without batching.
- Confirm Mongoose queries on user-owned collections include `{ isDeleted: false }` unless explicitly fetching deleted records.
- AI cache check: `POST /vocabulary/lookup` must check the `aiCache` collection (keyed by `hash(selectedText + contextText)`) **before** calling Gemini.
- No unbounded queries — `find()` without a limit on large collections must have a reasonable `.limit()` or pagination.

## 6. Code Quality & Edge Cases

- No unhandled Promise rejections — all `async` functions have `try/catch` fallback.
- No leftover `console.log`, commented-out code, or unused imports.
- TypeScript strict mode respected — no `any` casts without a comment explaining why.
- Naming conventions followed: files kebab-case, React components PascalCase, Mongoose schemas PascalCase with `Schema` suffix.
- Shared DTOs/types live in `packages/shared-types` — not duplicated across apps.

## Reporting Format

For each finding, provide:
1. **Severity** (🔴 Blocker / 🟠 Major / 🟡 Minor)
2. **File & line reference**
3. **What the problem is**
4. **Concrete fix with a code snippet**