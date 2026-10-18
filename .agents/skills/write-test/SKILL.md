---
name: write-test
description: Use when writing, running, or debugging unit tests for backend logic or frontend components.
---

# Write Test Skill

## Test Stack

- **Framework:** Vitest (all apps — backend, frontend, extension)
- **E2E:** NestJS built-in `@nestjs/testing` + `supertest` with Vitest (`vitest.config.e2e.ts`)
- **File naming:** `*.spec.ts` for unit tests, `*.e2e-spec.ts` for E2E
- **Run commands:**
  - **Both FE & BE:** `npm --prefix backend test && npm --prefix frontend test -- --run`
  - **Backend only:** `npm --prefix backend test` (unit) / `npm --prefix backend run test:e2e` (E2E)
  - **Frontend only:** `npm --prefix frontend test -- --run`

---

## 1. AI Mocking Requirement (mandatory)

- **ALWAYS** mock the `AIProvider` in `AiModule` — never trigger live Gemini calls in any automated test.
- Inject a Vitest mock that implements the `AIProvider` interface:

```ts
import { vi } from 'vitest';

const mockAiProvider = {
  explainInContext: vi.fn().mockResolvedValue({ meaning: 'mock meaning', example: 'mock example' }),
  generateQuiz: vi.fn().mockResolvedValue([]),
  chat: vi.fn().mockResolvedValue('mock reply'),
  reviewWriting: vi.fn().mockResolvedValue({ feedback: 'mock', suggestions: [] }),
};
```

- Provide it via `{ provide: AI_PROVIDER_TOKEN, useValue: mockAiProvider }` in the test module.

---

## 2. Unit Tests — Backend Business Logic

Target: pure functions with no I/O dependency. Primary example is the SM-2 scheduling function in `ReviewModule`.

```ts
import { describe, it, expect } from 'vitest';

describe('SM-2 scheduler', () => {
  it('should reset interval to 1 day on failed recall', () => {
    const result = scheduleNext({ remembered: false, easeFactor: 2.5, repetitions: 3, intervalDays: 6 });
    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(0);
  });

  it('should apply easeFactor on third successful recall', () => {
    const result = scheduleNext({ remembered: true, easeFactor: 2.5, repetitions: 2, intervalDays: 6 });
    expect(result.intervalDays).toBe(Math.round(6 * 2.5));
  });
});
```

Rules:
- No DB, no HTTP, no mocks needed — pure input → output assertions.
- Use deterministic inputs; never rely on `Date.now()` directly — inject a clock or pass `today` as a parameter.

---

## 3. NestJS E2E Tests — API Contract Validation

Every new endpoint needs at least one E2E test before being considered done (per `PROJECT-RULES.md`).

Always verify the standard response envelope `{ success: true, data: ... }` on success and `{ success: false, error: { code, message } }` on error:

```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';

describe('POST /vocabulary/lookup (e2e)', () => {
  it('should return 200 with correct envelope on valid input', async () => {
    const res = await request(app.getHttpServer())
      .post('/vocabulary/lookup')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ selectedText: 'scale', contextText: 'We need to scale.', sourceUrl: 'https://example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('meaning');
  });

  it('should return VALIDATION_ERROR envelope on missing field', async () => {
    const res = await request(app.getHttpServer())
      .post('/vocabulary/lookup')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ selectedText: 'scale' }); // missing contextText

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## 4. Frontend & Extension Mocks

When writing tests for Extension components or background workers, mock Chrome APIs with `vi.fn()`:

```ts
import { vi } from 'vitest';

global.chrome = {
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    sendMessage: vi.fn().mockResolvedValue({ meaning: 'mock' }),
    onMessage: { addListener: vi.fn() },
  },
} as any;
```

---

## 5. Test Structure Conventions

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('<UnitName or endpoint>', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should <expected behavior>', () => { ... });
  it('should handle <edge case>', () => { ... });
});
```

- One `describe` block per function / controller method / component.
- `it()` descriptions start with `should` to clearly state the expected behavior.
- `beforeEach` calls `vi.clearAllMocks()` to avoid state leakage between tests.
- Never use real timers — use `vi.useFakeTimers()` when time-sensitive logic is involved.