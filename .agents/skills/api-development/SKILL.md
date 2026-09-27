---
name: api-development
description: Use when adding a new REST endpoint to the NestJS backend to ensure it follows the API contract, DTO validation, auth guard, and response envelope standards.
---

# API Development Skill

Follow these steps **in order** every time a new endpoint is added.

## Step 0 — Update the Spec First

Before writing any code, update `@docs/API-CONTRACTS.md` with the new endpoint's request/response shape. This is required by `PROJECT-RULES.md`. Only after the contract is documented should you write the implementation.

---

## 1. DTO (Request Validation)

Create a DTO class in `<module>/dto/` using `class-validator`. Every field must be decorated:

```ts
// apps/backend/src/vocabulary/dto/lookup-vocabulary.dto.ts
import { IsString, IsUrl, IsNotEmpty, MaxLength } from 'class-validator';

export class LookupVocabularyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  selectedText: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  contextText: string;

  @IsUrl()
  sourceUrl: string;
}
```

- Use `@IsOptional()` for optional fields — never leave a field undecorated.
- Enable `ValidationPipe` globally in `main.ts` with `whitelist: true, forbidNonWhitelisted: true`.

---

## 2. Controller

```ts
@Post('lookup')
@UseGuards(JwtAuthGuard)
async lookup(@Body() dto: LookupVocabularyDto, @Request() req) {
  const data = await this.vocabularyService.lookup(dto, req.user.id);
  return { success: true, data };
}
```

- Always apply `@UseGuards(JwtAuthGuard)` unless the endpoint is explicitly public (e.g., `POST /auth/login`).
- Return `{ success: true, data }` — never return raw data directly.

---

## 3. Service — Error Handling Pattern

```ts
async lookup(dto: LookupVocabularyDto, userId: string) {
  // 1. Check cache first
  const cacheKey = hash(dto.selectedText + dto.contextText);
  const cached = await this.aiCacheModel.findOne({ key: cacheKey });
  if (cached) return { ...cached.result, cached: true };

  // 2. Call AI through AIProvider only — never call Gemini SDK directly
  let aiResult: { meaning: string; example: string };
  try {
    aiResult = await this.aiProvider.explainInContext(dto.selectedText, dto.contextText);
  } catch (err) {
    throw new HttpException(
      { success: false, error: { code: 'AI_PROVIDER_ERROR', message: 'AI service unavailable' } },
      HttpStatus.BAD_GATEWAY,
    );
  }

  // 3. Persist cache
  await this.aiCacheModel.create({ key: cacheKey, result: aiResult });
  return { ...aiResult, cached: false };
}
```

Rules:
- Always check AI cache before calling `AIProvider`.
- Wrap AI calls in `try/catch` and throw `AI_PROVIDER_ERROR` — never let AI failures propagate unhandled.
- NOT_FOUND pattern: `throw new NotFoundException({ success: false, error: { code: 'NOT_FOUND', message: '...' } })`.

---

## 4. Response Envelope Reference

All endpoints must return this shape (from `@docs/API-CONTRACTS.md`):

```ts
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

Valid error codes: `VALIDATION_ERROR` | `UNAUTHORIZED` | `NOT_FOUND` | `RATE_LIMITED` | `AI_PROVIDER_ERROR`

---

## 5. Rate Limiting (AI-heavy endpoints)

Apply `@Throttle()` on cost-heavy endpoints — read limits from `ConfigModule`, never hardcode:

```ts
@Throttle({ default: { limit: this.configService.get('LOOKUP_RATE_LIMIT'), ttl: 86400000 } })
@Post('lookup')
```

Default guidance from `ARCHITECTURE.md §7`: lookup 100/day, quiz 10/day, chat 50/day.

---

## 6. Checklist Before Committing

- [ ] `API-CONTRACTS.md` updated with new endpoint
- [ ] DTO created with full `class-validator` decorators
- [ ] `JwtAuthGuard` applied (or explicitly documented as public)
- [ ] Response uses `{ success: true, data }` envelope
- [ ] Error paths use defined error codes
- [ ] AI calls wrapped in `try/catch` returning `AI_PROVIDER_ERROR`
- [ ] E2E test covers happy path + validation error path
