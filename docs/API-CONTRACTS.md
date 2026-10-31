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

**`GET /auth/me`** (Bearer token required) → `{ "id": "...", "email": "...", "displayName": "...", "avatarUrl": null, "role": "admin", "permissions": ["users:read", "roles:manage"], "settings": {...} }`

## Users

**`GET /users/:id`**
Response: `{ "_id": "...", "email": "...", "displayName": "...", "avatarUrl": null, "roleId": "...", "settings": {...} }`

**`PATCH /users/:id`**
Request: `{ "displayName"?: "...", "avatarUrl"?: "...", "roleId"?: "..." }`
Response: `{ "_id": "...", "email": "...", "displayName": "...", "avatarUrl": "...", "roleId": "...", "settings": {...} }`

**`PATCH /users/:id/role`**
Request: `{ "roleId": "..." }`
Response: `{ "_id": "...", "email": "...", "roleId": "...", "settings": {...} }`

**`PATCH /users/:id/settings`**
Request: `{ "dailyReviewGoal"?: 20, "quizDefaultCount"?: 10, "timezone"?: "UTC" }`
Response: `{ "_id": "...", "email": "...", "displayName": "...", "avatarUrl": "...", "settings": {...} }`

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
Response: `{ "occurrences": [{ "id": "...", "lemma": "scale", "partOfSpeech": "verb", "selectedText": "scaling", "sentence": "...", "meaning": "...", "example": "...", "sourceUrl": "...", "sourceTitle": "..." }] }`

**`POST /review/:occurrenceId/result`**
Request: `{ "remembered": true }`
Response: `{ "nextDueDate": "2026-09-27T00:00:00Z", "intervalDays": 6 }`

**`PATCH /review/:occurrenceId/suspend`**
Request: `{ "suspended": true }`
Response: `{ "success": true, "suspended": true }`

## Quiz

**`POST /quiz/generate`**
Request: `{ "scope": "all" | "recent", "count": 10 }`
Response: `{ "quizId": "...", "questions": [{ "index": 0, "questionText": "...", "options": ["a","b","c","d"] }] }`
*(note: `correctIndex`/`explanation` are withheld until answered — see below)*

**`POST /quiz/:id/answer`**
Request: `{ "questionIndex": 0, "selectedIndex": 2 }`
Response: `{ "correct": false, "correctIndex": 1, "explanation": "..." }`

**`GET /quiz/:id/result`**
Response: `{ "quizId": "...", "score": 7, "total": 10, "completedAt": "...", "answers": [{ "questionIndex": 0, "selectedIndex": 1, "correct": true }] }`

**`GET /quiz/history`**
Query: `?page=1&limit=10`
Response: `{ "items": [{ "quizId": "...", "score": 7, "total": 10, "scope": "all", "completedAt": "..." }], "total": 1, "page": 1, "limit": 10, "totalPages": 1 }`

## Chat

**`POST /chat/message`**
Request: `{ "sessionId"?: "...", "message": "How do I use 'scale' in a sentence?" }`
Response: `{ "sessionId": "...", "reply": "..." }`

**`GET /chat/sessions`**
Query: `?page=1&limit=10`
Response: `{ "items": [{ "id": "...", "title": "How do I use 'scale'...", "updatedAt": "...", "messageCount": 4 }], "total": 1, "page": 1, "limit": 10, "totalPages": 1 }`

**`GET /chat/sessions/:id`**
Response: `{ "id": "...", "title": "How do I use 'scale'...", "messages": [{ "role": "user", "content": "...", "createdAt": "..." }, { "role": "assistant", "content": "...", "createdAt": "..." }], "createdAt": "...", "updatedAt": "..." }`

**`DELETE /chat/sessions/:id`**
Response: `{ "success": true }`

**`GET /chat/suggested-words`**
Response: `{ "words": ["scale", "ubiquitous", "resilient", "pragmatic", "leverage"] }`

## Writing Review

**`POST /writing/review`**
Request:
```json
{
  "text": "I have went to school yesterday because the weather was very sunny."
}
```
Response:
```json
{
  "_id": "672370000000000000000001",
  "originalText": "I have went to school yesterday because the weather was very sunny.",
  "wordCount": 11,
  "feedback": "Overall, the sentence clearly conveys your action and reasoning. However, there is a common verb tense error in the main clause.",
  "suggestions": [
    "Use 'went' without 'have' for past events completed yesterday: 'I went to school yesterday because the weather was very sunny.'"
  ],
  "aiModel": "gemini-flash-lite-latest",
  "createdAt": "2026-10-31T16:00:00.000Z"
}
```

**`GET /writing/history?page=1&limit=10`**
Response:
```json
{
  "items": [
    {
      "_id": "672370000000000000000001",
      "originalText": "I have went to school yesterday because the weather was very sunny.",
      "wordCount": 11,
      "suggestionsCount": 1,
      "createdAt": "2026-10-31T16:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**`GET /writing/history/:id`**
Response:
```json
{
  "_id": "672370000000000000000001",
  "originalText": "I have went to school yesterday because the weather was very sunny.",
  "wordCount": 11,
  "feedback": "Overall, the sentence clearly conveys your action and reasoning...",
  "suggestions": [
    "Use 'went' without 'have' for past events completed yesterday: 'I went to school yesterday because the weather was very sunny.'"
  ],
  "aiModel": "gemini-flash-lite-latest",
  "createdAt": "2026-10-31T16:00:00.000Z"
}
```

**`DELETE /writing/history/:id`**
Response:
```json
{
  "success": true
}
```

**`GET /writing/suggested-words`**
Response:
```json
{
  "words": ["resilient", "ubiquitous", "scale", "leverage", "pragmatic"]
}
```

## Dashboard

**`GET /dashboard/stats`**
Response:
```json
{
  "dueCount": 12,
  "totalSaved": 240,
  "totalReviewed": 180,
  "todayReviewedCount": 5,
  "dailyReviewGoal": 20,
  "streakDays": 3,
  "recentQuizzes": [
    {
      "quizId": "...",
      "score": 8,
      "total": 10,
      "completedAt": "2026-10-31T14:00:00.000Z"
    }
  ],
  "recentActivity": [
    {
      "id": "...",
      "type": "saved",
      "title": "Saved 'scale'",
      "description": "to increase in size...",
      "timestamp": "2026-10-31T14:30:00.000Z"
    }
  ],
  "weeklyProgress": [
    {
      "date": "2026-10-31",
      "savedCount": 2,
      "reviewedCount": 5,
      "quizCount": 1
    }
  ]
}
```

## Roles

**`POST /roles`**
Request: `{ "name": "admin", "description": "Administrator with full access", "permissions"?: ["<permissionId>"], "isActive"?: true }`
Response: `{ "_id": "...", "name": "admin", "description": "Administrator with full access", "permissions": [...], "isActive": true }`

**`GET /roles`**
Response: `[{ "_id": "...", "name": "admin", "description": "...", "permissions": [...], "isActive": true }]`

**`GET /roles/:id`**
Response: `{ "_id": "...", "name": "admin", "description": "...", "permissions": [...], "isActive": true }`

**`PATCH /roles/:id`**
Request: `{ "name"?: "...", "description"?: "...", "permissions"?: ["<permissionId>"], "isActive"?: boolean }`
Response: `{ "_id": "...", "name": "...", "description": "...", "permissions": [...], "isActive": true }`

**`DELETE /roles/:id`**
Response: `{ "success": true }`

## Permissions

**`POST /permissions`**
Request: `{ "name": "users:read", "description": "Read user profiles", "module": "users", "action": "read" }`
Response: `{ "_id": "...", "name": "users:read", "description": "Read user profiles", "module": "users", "action": "read" }`

**`GET /permissions`**
Response: `[{ "_id": "...", "name": "users:read", "description": "...", "module": "users", "action": "read" }]`

**`GET /permissions/:id`**
Response: `{ "_id": "...", "name": "users:read", "description": "...", "module": "users", "action": "read" }`

**`PATCH /permissions/:id`**
Request: `{ "name"?: "...", "description"?: "...", "module"?: "...", "action"?: "..." }`
Response: `{ "_id": "...", "name": "...", "description": "...", "module": "...", "action": "..." }`

**`DELETE /permissions/:id`**
Response: `{ "success": true }`

## Error Codes (non-exhaustive, extend as needed)

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Request body failed DTO validation |
| `UNAUTHORIZED` | Missing/invalid/expired token |
| `FORBIDDEN` | Access denied: user lacks required role or permission |
| `NOT_FOUND` | Resource doesn't exist or doesn't belong to user |
| `RATE_LIMITED` | Throttle limit hit (see `ARCHITECTURE.md` §7) |
| `AI_PROVIDER_ERROR` | Gemini call failed or returned unusable content |

