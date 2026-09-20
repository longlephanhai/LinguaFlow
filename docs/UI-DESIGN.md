# UI-DESIGN.md — LinguaFlow (optional, lightweight)

> No Figma file exists yet — this documents key screen layouts at a functional level, enough for an AI agent to scaffold UI. Replace with a Figma link if one is created later.

## Extension — Content Script Popup (on text selection)

- Small floating card anchored near the selected text.
- States: `loading` (spinner + "Looking up...") → `result` (meaning + example + "Save" button) → `error` ("Couldn't look this up — retry" + retry button).
- Save button shows a brief "Saved ✓" confirmation, then auto-dismisses after ~1.5s.

## Extension — Toolbar Popup

- If not logged in: login form.
- If logged in: quick stats (due count) + "Open Web App" button.

## Web — Dashboard (landing page after login)

- Top: due-count card + "Start Review" CTA.
- Recent activity list (last saves/reviews/quiz results).
- Basic stats row: total saved, total reviewed.

## Web — Vocabulary Manager

- List grouped by `vocabularyItem` (lemma), expandable to show meanings → occurrences.
- Each occurrence row: sentence (highlighted target word), source link, edit/delete icons.

## Web — Flashcard Review

- One card at a time: sentence with the word highlighted → "Show meaning" → "Remembered / Forgot" buttons.
- Progress indicator (e.g., "5 / 12 due").

## Web — Quiz

- One question at a time, 4 options as buttons.
- After answering: correct/incorrect highlight + explanation, then "Next".
- Final screen: score summary.

## Web — AI Chat

- Standard chat UI: message list + input box. Suggested-word chips above input (pulled from vocabulary bank) the user can tap to insert.

## Web — Writing Review

- Textarea input → "Review" button → feedback panel below (grammar notes + suggestions list).
