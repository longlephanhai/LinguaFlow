# DATA-SCHEMA.md — LinguaFlow

> MongoDB collections (Mongoose). Enforces the item → meaning → occurrence chain from `PRD.md` — never flatten vocabulary into a single record.

## `users`

```ts
{
  _id: ObjectId,
  email: string,        // unique, indexed
  passwordHash: string,
  createdAt: Date,
  settings: {
    dailyReviewGoal: number,    // default 20
    quizDefaultCount: number,   // default 10
  }
}
```

## `vocabularyItems` — the word/lemma itself

```ts
{
  _id: ObjectId,
  userId: ObjectId,      // indexed
  lemma: string,          // e.g. "scale"
  createdAt: Date,
}
// Index: { userId: 1, lemma: 1 } unique — one item per lemma per user
```

## `meanings` — one specific sense of a lemma (a lemma can have many)

```ts
{
  _id: ObjectId,
  vocabularyItemId: ObjectId,  // indexed, ref vocabularyItems
  definition: string,           // AI-generated, in-context explanation
  example: string,               // AI-generated example sentence
  createdAt: Date,
}
// Index: { vocabularyItemId: 1 }
```

## `occurrences` — one capture event; holds original context + review state

```ts
{
  _id: ObjectId,
  meaningId: ObjectId,    // indexed, ref meanings
  userId: ObjectId,        // indexed (denormalized for fast "due" queries)
  sentence: string,         // the original sentence the user selected from
  sourceUrl: string,
  capturedAt: Date,
  review: {
    easeFactor: number,      // default 2.5
    intervalDays: number,    // default 1
    repetitions: number,     // default 0
    dueDate: Date,            // indexed — queried by ReviewModule
    lastReviewedAt: Date | null,
  }
}
// Index: { userId: 1, "review.dueDate": 1 } — powers GET /review/due
```

**Why 3 collections instead of 1:** a lemma ("scale") can have multiple meanings ("weighing device" vs. "proportion"), and each meaning can be captured multiple times in different sentences (occurrences). Flattening would either duplicate the definition per capture or lose the fact that two captures share the same meaning. This is a fixed constraint from `PRD.md`.

## `quizzes`

```ts
{
  _id: ObjectId,
  userId: ObjectId,        // indexed
  scope: 'all' | 'recent', // vocabulary selection scope used to generate it
  questions: [{
    occurrenceId: ObjectId,
    questionText: string,
    options: [string, string, string, string],  // always 4
    correctIndex: number,   // 0-3
    explanation: string,
  }],
  createdAt: Date,
}
```

## `quizResults`

```ts
{
  _id: ObjectId,
  quizId: ObjectId,        // indexed, ref quizzes
  userId: ObjectId,         // indexed
  answers: [{
    questionIndex: number,
    selectedIndex: number,
    correct: boolean,
  }],
  score: number,             // correct count
  completedAt: Date,
}
```

## `chatSessions`

```ts
{
  _id: ObjectId,
  userId: ObjectId,        // indexed
  messages: [{
    role: 'user' | 'assistant',
    content: string,
    createdAt: Date,
  }],
  createdAt: Date,
}
```

## `writingReviews`

```ts
{
  _id: ObjectId,
  userId: ObjectId,        // indexed
  originalText: string,
  feedback: string,
  suggestions: [string],
  createdAt: Date,
}
```

## `aiCache` (architecture §7 — lookup cache, TTL index)

```ts
{
  _id: ObjectId,
  hash: string,             // sha256(selectedText + contextText), unique indexed
  meaning: string,
  example: string,
  createdAt: Date,          // TTL index, expires after 7 days
}
```

## Migration Notes

None yet — this is the first schema version (v1). Log future changes here with a version marker, e.g. `v2 — added occurrences.review.suspended flag`.
