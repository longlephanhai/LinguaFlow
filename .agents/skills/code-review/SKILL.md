---
name: code-review
description: Use to review recent code diffs for security, performance, architecture adherence, and bugs before merging or committing.
---

# Code Review Skill

When performing code reviews:

1. **Architecture & Integrity Check:**
   - Verify strict adherence to `@docs/PROJECT-RULES.md` and `@docs/ARCHITECTURE.md`.
   - Ensure the 3-layer data model (`vocabularyItem` -> `meaning` -> `occurrence`) is maintained and NOT flattened.
   - Confirm no module outside `AiModule` directly imports or calls the Gemini SDK.

2. **Security & Privacy Boundary:**
   - Check that no API keys or secrets are committed.
   - Confirm Chrome Extension scripts only process user-selected text and minimal context — NEVER full DOM (`document.body.innerText`).
   - Ensure input validation via `class-validator` DTOs is present on all new backend endpoints.

3. **Code Quality & Edge Cases:**
   - Check for unhandled Promise rejections and proper `try/catch` fallback blocks returning `AI_PROVIDER_ERROR` where applicable.
   - Look for leftover `console.log`, commented-out code, or unused imports.
   - Provide actionable, constructive feedback with clear code snippets for any requested fix.