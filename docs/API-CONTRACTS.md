# API-CONTRACTS.md — LinguaFlow

> REST contract between Web/Extension clients and the NestJS backend. Update this file **before** implementing a new endpoint (see `PROJECT-RULES.md`).

## Response Envelope (all endpoints)

```ts
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "email is required" } }
```

## Auth

**`POST /auth/register`**
Request: `{ "email": "a@b.com", "password": "..." }`
Response: `{ "accessToken": "...", "refreshToken": "...", "user": { "id": "...", "email": "..." } }`

**`POST /auth/login`** — same shape as register.

**`POST /auth/refresh`**
Request: `{ "refreshToken": "..." }`
Response: `{ "accessToken": "..." }`

**`POST /auth/logout`** → `{ "success": true }`

**`GET /auth/me`** (Bearer token required) → `{ "id": "...", "email": "...", "settings": {...} }`

## Vocabulary

**`POST /vocabulary/lookup`** — Extension capture step (does NOT save, just explains)
Request: `{ "selectedText": "scale", "contextText": "...we need to scale this system...", "sourceUrl": "https://..." }`
Response: `{ "meaning": "to increase in size or amount proportionally", "example": "The startup needs to scale its infrastructure.", "cached": false }`

**`POST /vocabulary/occurrences`** — Save step (creates item/meaning/occurrence chain as needed)
Request: `{ "lemma": "scale", "meaning": "...", "example": "...", "sentence": "...", "sourceUrl": "..." }`
Response: `{ "occurrenceId": "...", "vocabularyItemId": "...", "meaningId": "..." }`

**`GET /vocabulary`** — list grouped by item
Response: `{ "items": [{ "id": "...", "lemma": "scale", "meaningsCount": 2, "occurrencesCount": 3 }] }`

**`GET /vocabulary/:itemId/occurrences`**
Response: `{ "occurrences": [{ "id": "...", "sentence": "...", "sourceUrl": "...", "meaning": "...", "capturedAt": "..." }] }`

**`PATCH /vocabulary/occurrences/:id`**
Request: `{ "sentence"?: "...", "meaning"?: "..." }` → `{ "success": true }`

**`DELETE /vocabulary/occurrences/:id`** → `{ "success": true }`

## Review

**`GET /review/due`**
Response: `{ "occurrences": [{ "id": "...", "lemma": "scale", "sentence": "...", "meaning": "..." }] }`

**`POST /review/:occurrenceId/result`**
Request: `{ "remembered": true }`
Response: `{ "nextDueDate": "2026-09-27T00:00:00Z", "intervalDays": 6 }`

## Quiz

**`POST /quiz/generate`**
Request: `{ "scope": "all" | "recent", "count": 10 }`
Response: `{ "quizId": "...", "questions": [{ "index": 0, "questionText": "...", "options": ["a","b","c","d"] }] }`
*(note: `correctIndex`/`explanation` are withheld until answered — see below)*

**`POST /quiz/:id/answer`**
Request: `{ "questionIndex": 0, "selectedIndex": 2 }`
Response: `{ "correct": false, "correctIndex": 1, "explanation": "..." }`

**`GET /quiz/:id/result`**
Response: `{ "score": 7, "total": 10, "completedAt": "..." }`

## Chat

**`POST /chat/message`**
Request: `{ "sessionId"?: "...", "message": "How do I use 'scale' in a sentence?" }`
Response: `{ "sessionId": "...", "reply": "..." }`

## Writing Review

**`POST /writing/review`**
Request: `{ "text": "I have went to school yesterday." }`
Response: `{ "feedback": "...", "suggestions": ["Use 'went' without 'have' for simple past: 'I went to school yesterday.'"] }`

## Dashboard

**`GET /dashboard/stats`**
Response: `{ "dueCount": 12, "totalSaved": 240, "totalReviewed": 180, "recentQuizzes": [...], "recentActivity": [...] }`

## Error Codes (non-exhaustive, extend as needed)

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Request body failed DTO validation |
| `UNAUTHORIZED` | Missing/invalid/expired token |
| `NOT_FOUND` | Resource doesn't exist or doesn't belong to user |
| `RATE_LIMITED` | Throttle limit hit (see `ARCHITECTURE.md` §7) |
| `AI_PROVIDER_ERROR` | Gemini call failed or returned unusable content |
