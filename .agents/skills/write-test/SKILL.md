---
name: write-test
description: Use when writing, running, or debugging unit tests for backend logic or frontend components.
---

# Write Test Skill

When implementing or running tests:

1. **AI Mocking Requirement:**
   - ALWAYS mock the `AIProvider` in `AiModule`.
   - NEVER trigger live calls to the Gemini API during test execution.

2. **Backend Logic & Scheduling Tests:**
   - Unit test pure business logic (specifically the simplified SM-2 algorithm in `ReviewModule`) in isolation with deterministic inputs.
   - Write NestJS E2E tests using `supertest` to validate DTO request bodies and standard response envelopes (`{ success: true, data: ... }`).

3. **Frontend & Extension Mocks:**
   - Mock `chrome.storage.local` and `chrome.runtime.sendMessage` when writing tests for Extension components or background workers.