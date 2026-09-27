---
name: ai-prompt-engineering
description: Use when writing, improving, or debugging prompts inside AiModule, or when Gemini returns unexpected/unparseable output.
---

# AI Prompt Engineering Skill

All Gemini interactions go through `AiModule`'s `AIProvider` interface. This skill covers how to write reliable prompts and handle failures gracefully.

## 1. Where Prompts Live

All prompt strings belong in `apps/backend/src/ai/prompts/` as exported constants — never inline prompts directly in service methods. This makes them easy to find, version, and test.

```
apps/backend/src/ai/
├── ai.module.ts
├── ai.provider.ts          # AIProvider interface
├── gemini.provider.ts      # GeminiProvider implementation
└── prompts/
    ├── explain-in-context.prompt.ts
    ├── generate-quiz.prompt.ts
    ├── chat-system.prompt.ts
    └── review-writing.prompt.ts
```

---

## 2. Structured Output Pattern

Always request JSON output from Gemini when parsing structured data. Use a schema comment in the prompt and validate the parsed result:

```ts
// prompts/explain-in-context.prompt.ts
export const explainInContextPrompt = (selectedText: string, contextText: string) => `
You are an English vocabulary assistant. Explain the word or phrase below based on the context provided.

Word/phrase: "${selectedText}"
Context: "${contextText}"

Respond with ONLY a valid JSON object matching this schema (no markdown, no extra text):
{
  "meaning": "a clear, concise definition in plain English",
  "example": "a new example sentence using this word/phrase"
}
`.trim();
```

Parsing and validation in the provider:

```ts
async explainInContext(selectedText: string, contextText: string) {
  const raw = await this.model.generateContent(explainInContextPrompt(selectedText, contextText));
  const text = raw.response.text().trim();

  let parsed: { meaning: string; example: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`AI_PARSE_ERROR: expected JSON, got: ${text.slice(0, 200)}`);
  }

  if (typeof parsed.meaning !== 'string' || typeof parsed.example !== 'string') {
    throw new Error(`AI_SCHEMA_ERROR: missing required fields in response`);
  }

  return parsed;
}
```

---

## 3. Debugging Unexpected Output

When Gemini returns unparseable or wrong output, diagnose in this order:

1. **Log the raw response** (dev only, never in production — raw text may contain user data):
   ```ts
   if (process.env.NODE_ENV === 'development') {
     console.debug('[AiModule] raw response:', text.slice(0, 500));
   }
   ```

2. **Check for markdown wrapping** — Gemini sometimes wraps JSON in ` ```json ... ``` `. Strip it:
   ```ts
   const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
   ```

3. **Tighten the prompt** — Add `"Do not include any explanation, markdown, or code fences."` as a final instruction.

4. **Use `responseMimeType`** if the Gemini SDK version supports it:
   ```ts
   generationConfig: { responseMimeType: 'application/json' }
   ```

---

## 4. Prompt Writing Guidelines

- **Be specific about output format** — always include the exact JSON schema the prompt must return.
- **Use the word "ONLY"** for format instructions: `"Respond with ONLY valid JSON..."`.
- **Keep context minimal** — send `selectedText` + `contextText`, never full page DOM. This is both a performance and a privacy requirement (`PROJECT-RULES.md §Extension Privacy`).
- **Version prompts** — when making a significant change to a prompt, note it in `CHANGELOG.md` so prompt regressions can be traced.

---

## 5. Timeout & Fallback

Every `AIProvider` call must have a timeout. Wrap with a timeout utility:

```ts
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), ms))]);

const result = await withTimeout(this.aiProvider.explainInContext(text, ctx), 10_000);
```

If timeout or parse error occurs, the calling service must catch and throw `AI_PROVIDER_ERROR` (never let it surface as an unhandled 500).
