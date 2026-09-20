# Product Requirements Document — LinguaFlow

## 1. Executive Summary & Core Concept

**LinguaFlow** is an AI-assisted English learning system consisting of a Chrome Extension (contextual word capture) and a Web Application (spaced review, AI quizzes, AI chat & writing practice).

- **Core Differentiator:** Vocabulary is never learned as an isolated word. It is always saved and reviewed with its original context sentence.
- **Privacy Boundary:** The Extension operates strictly on explicit user selection + minimal context. It **never** scans or transmits full webpage DOMs.
- **Closed Learning Loop:** Encounter unknown word → Extension captures selection + minimal context → AI explains in-context → Save to bank → Scheduled Flashcard Review → AI Multiple-Choice Quiz → AI Chat & Writing Application → Dashboard Tracking.

## 2. Goals & Non-Goals

### Goals
- **G1 (Zero Friction):** Instant in-context lookup without leaving the active reading page.
- **G2 (Context Preservation):** Retain sentence context, source URL, and specific meaning for every saved item.
- **G3 (Loop Closure):** Transform passive lookups into active, scheduled spaced reviews and AI quizzes.
- **G4 (Active Application):** Provide AI chat and writing review tools to practice using saved vocabulary.

### Non-Goals (Strictly Out of MVP Scope)
- Full-page DOM scanning, passive page monitoring, or general document translation.
- YouTube/Netflix subtitle integration, dictation, shadowing, or speech/pronunciation recognition.
- Non-multiple-choice quiz types (fill-in-the-blank, listening, writing quizzes).
- Full AI tutoring (syllabus management, adaptive grade-level curriculum).
- Export to CSV/Anki, team/classroom sharing, or complex gamification streaks.

## 3. Target User & JTBD

- **Primary User:** University students & young adults (B1–B2 level) reading English content online.
- **JTBD-1 (In-Context Lookup):** Understand words in their exact current sentence without losing reading momentum.
- **JTBD-2 (Contextual Saving):** Preserve words along with original sentences to remember usage.
- **JTBD-3 (Spaced Recall):** Receive automated review prompts based on memory decay.
- **JTBD-4 (Self-Testing):** Validate retention through AI-generated quizzes.
- **JTBD-5 (Application):** Practice using saved words in AI chat conversations and essays.

## 4. Functional Requirements (FR)

### 4.1 Authentication
- **FR-AUTH-001:** Users can register, log in, and log out.
- **FR-AUTH-002:** Maintain active authenticated sessions shared seamlessly between Web and Extension.
- **FR-AUTH-003:** Require valid auth token before allowing any vocabulary save, review, or quiz action.

### 4.2 Chrome Extension — Contextual Capture
- **FR-EXT-001:** Detect native user text selection (`selectionchange`/`mouseup`) on any standard HTML page.
- **FR-EXT-002:** Capture exact `selectedText` + minimum surrounding `contextText` (e.g., immediate parent sentence).
- **FR-EXT-003:** Display AI-generated in-context meaning and 1 relevant example sentence.
- **FR-EXT-004:** One-click save to vocabulary bank (attaching original sentence + source URL).
- **FR-EXT-005:** Display explicit loading spinner and non-silent error states (e.g., API timeout, save failure).
- **FR-EXT-006 (Privacy Enforcement):** Only process user-selected text + minimal context. **NEVER** scan, serialise, or transmit `document.body.innerText` or entire page DOM.

### 4.3 Vocabulary Management (Web)
- **FR-VOCAB-001:** View saved vocabulary list grouped by `vocabularyItem` (lemma).
- **FR-VOCAB-002 (Mandatory Data Hierarchy):** Enforce 3-layer structure: `vocabularyItem` (lemma) → `meaning` (specific sense) → `occurrence` (sentence + source + timestamp). **Never flatten into a single record.**
- **FR-VOCAB-003:** Allow users to view, edit, or delete individual occurrences without destroying the parent lemma.

### 4.4 Flashcard Review (Web)
- **FR-REVIEW-001:** Fetch due review items dynamically based on performance scheduling.
- **FR-REVIEW-002:** Display flashcards showing original sentence context with target word highlighted.
- **FR-REVIEW-003:** User self-assesses recall (Remembered / Forgot), updating the item's review schedule.

### 4.5 AI Multiple-Choice Quiz (Web)
- **FR-QUIZ-001:** Generate multiple-choice quizzes sourced from user's vocabulary bank (scope: all / recent).
- **FR-QUIZ-002:** Questions MUST present **exactly 4 answer options**.
- **FR-QUIZ-003:** Evaluate answers immediately upon selection, returning correct/incorrect status + AI explanation.
- **FR-QUIZ-004:** Record quiz scores and update learning statistics.

### 4.6 AI Chat & Writing Review (Web)
- **FR-CHAT-001:** Free-form conversational English chat interface. Suggest relevant saved vocabulary chips above input for user insertion.
- **FR-WRITING-001:** Submit text paragraphs → receive AI feedback highlighting grammar mistakes, style suggestions, and usage improvements.

### 4.7 Dashboard & Settings
- **FR-DASH-001:** Display due review count, total saved/reviewed metrics, recent quiz scores, and recent activity logs.
- **FR-SETTINGS-001:** Manage basic user profile and study goal preferences (e.g., daily review target).

## 5. Edge Cases & Error Handling (EDGE)

- **EDGE-001:** *Empty/Short Selection:* Extension must not trigger AI requests if selection is empty or whitespace.
- **EDGE-002:** *Insufficient Context:* If context is too short to disambiguate meaning, AI indicates low-confidence rather than hallucinating an exact definition.
- **EDGE-003:** *AI Failure / Timeout:* Show clear error UI ("Lookup failed. Retry?") — never fail silently or hang infinitely in loading state.
- **EDGE-004:** *Save Failure:* If database save fails, preserve user's captured input in popup state and allow 1-click retry.
- **EDGE-005:** *Malformed AI JSON:* If AI fails structured output validation, fallback gracefully returning `AI_PROVIDER_ERROR`.
- **EDGE-006:** *Unauthenticated Action:* Extension/Web intercepts API requests and prompts login UI instead of throwing raw 401 screens.
- **EDGE-007:** *No Due Cards:* Display clean empty state with CTA to "Capture more words" or "Take a Quiz".
- **EDGE-008:** *Zero Saved Words (New User):* Display onboard guidance pointing to Extension installation and capture flow.
- **EDGE-009:** *Insufficient Quiz Items:* If user has < 4 saved occurrences, show warning prompting them to save more words before generating a quiz.

## 6. Technical & System Constraints

- **Data Architecture:** Monolith NestJS API serving React Web SPA and CRXJS Chrome Extension.
- **Data Integrity:** Strict Mongoose schemas adhering to 3-layer hierarchy (`vocabularyItem` → `meaning` → `occurrence`).
- **AI Abstraction:** All AI operations route through `AiModule` (`AIProvider` interface). No module directly imports Gemini SDK.
- **Security:** JWT bearer tokens. Tokens stored in `chrome.storage.local` for Extension (not `localStorage`). Passwords hashed with `bcrypt`. Never hardcode API keys.

## 7. Success Metrics

- **Primary Metric (Loop Closure Rate):** % of saved vocabulary items reviewed via flashcards or quizzes within 7 days.
- **Engagement:** Vocabulary items saved per active user per week.
- **Quiz Completion:** Started vs. completed quiz sessions.
- **Retention:** Week 2 and Week 4 active user retention.