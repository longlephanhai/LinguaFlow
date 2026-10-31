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

## Web — Settings & Profile

- Profile Card: Avatar preview + initials, display name, email (disabled), avatar URL.
- Study Preferences Card: Daily review goal slider (1-100), default quiz questions select, study timezone select with "Detect Local" button.
- Account Status Card: Role badge, privacy statement, log out button.

## Extension — Video Player Subtitle Overlay (Phase 2)

- Dual Subtitle bar anchored at bottom center of `<video>`.
- Top line: English target cue with clickable word tokens.
- Bottom line: Vietnamese translated cue.
- Quick Widget Floating Bar: Speed button (`0.75x`, `1.0x`), A/S/D hotkey guide tooltip, Dictate toggle, Shadow toggle.
- Word hover/click: Video auto-pauses, displays floating AI explanation popup with 1-click Save button (captures word + sentence + timestamp).

## Web — Video Study Room (Phase 2)

- Top: URL input ("Paste YouTube link...") + "Load Video" button.
- Left column (60%): Embedded YouTube player with synced dual subtitles.
- Right column (40%): Tabbed study panel:
  - Tab 1: **Full Script** — scrollable list of dialogue cues, active cue highlighted, click jumps video.
  - Tab 2: **Dictation** — auto-loop current cue, typing input box with real-time green/red character match, hint button.
  - Tab 3: **Shadowing** — listen native cue → countdown → record button → AI pronunciation score & A/B playback.

## Web — Multi-Modal Flashcard (Phase 2)

- Front: Context sentence with highlighted word (same as MVP).
- Back: Meaning + example + "Play Context Clip" button (if captured from video).
- Clicking "Play Context Clip" opens mini video player pre-rolled 2s before timestamp and auto-stops after 3s.
