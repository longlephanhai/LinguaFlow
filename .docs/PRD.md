# Product Requirements Document — LinguaFlow

## 1. Document Overview

- **Product name:** LinguaFlow
- **Document purpose:** This PRD translates the approved Product Discovery into structured, testable product requirements. It defines WHAT the product must do and WHY, so that it can later be broken into User Stories, Acceptance Criteria, and eventually Architecture, Database, and API design.
- **Relationship to Product Discovery:** `docs/PRODUCT-DISCOVERY.md` is the authoritative source of truth for product direction, target users, MVP scope, and product boundaries. This PRD does not introduce new product decisions, features, or scope — it operationalizes what was already approved.
- **Document status:** Draft, pending review. Product Discovery is approved; this PRD has not yet been approved.
- **Intended audience:** Product owner, engineering leads, designers, and anyone who will later write User Stories, Architecture, Database, or API specifications for LinguaFlow.

If anything in this PRD appears to conflict with `docs/PRODUCT-DISCOVERY.md`, the Product Discovery document governs and this PRD should be corrected.

## 2. Product Summary

LinguaFlow is an AI-assisted English learning system made of two coordinated surfaces:

- **The Web application** — where users manage their vocabulary, review it with flashcards on a performance-based schedule, take multiple-choice quizzes, and view basic learning statistics.
- **The Chrome Extension** — a contextual capture tool. It lets a user select unfamiliar text on any webpage, captures that selection plus the minimum surrounding context needed to interpret it, and returns an AI explanation of what that text means *in that specific occurrence*, along with an example.

**Core product differentiator:** vocabulary is never learned as an isolated word. It is always saved with the original context in which it was encountered, and only the minimum necessary context is ever captured — never a full webpage.

**Core learning loop:** Encounter an unknown word/sentence → select it → Extension captures the selection plus minimum necessary context → AI explains the meaning in context and gives an example → user saves the vocabulary with its original context → vocabulary is scheduled for review based on past performance → user reviews via flashcards → user practices via multiple-choice quiz → user tracks progress.

## 3. Goals

The MVP must achieve the following concrete product goals:

- **G1 — Reduce friction when looking up vocabulary.** A user must be able to go from "I don't know this word" to "I understand it in context" without leaving the page they are reading or switching to a separate tool.
- **G2 — Preserve vocabulary context.** Every saved vocabulary item must retain the sentence/context it came from, not just an isolated word and definition.
- **G3 — Turn saved vocabulary into reviewable learning items.** Anything saved via the Extension must become available for structured review in the Web application, not just stored as a static record.
- **G4 — Create a complete capture → review → quiz loop.** The product must connect capture, scheduled review, and quizzing into one continuous loop rather than leaving them as disconnected features.
- **G5 — Give users basic visibility into progress.** Users must be able to see, at a basic level, how much they've saved, reviewed, and how they're performing on quizzes.

No goals beyond these are introduced in this PRD.

## 4. Non-Goals

The following are explicitly outside MVP scope, per the approved Product Discovery:

- YouTube learning
- Netflix learning
- Subtitle learning
- Dictation
- Shadowing
- Speaking practice
- Pronunciation feedback
- AI conversation
- Personalized learning paths
- PDF / article / full-passage learning
- AI passage summarization
- Non-multiple-choice quiz types (fill-in-the-blank, listening, writing, speaking)
- Full AI tutoring
- General-purpose translation (LinguaFlow explains meaning-in-context for learning, not bulk/arbitrary translation)
- Passive webpage scanning or monitoring (the Extension only ever processes explicitly selected text plus minimum necessary context)

## 5. Target Users

### Primary MVP User
University students and young adult English learners at B1–B2 who regularly read English content online. This is **one unified MVP audience** — the product does not build separate experiences, flows, or UI paths for different user segments in MVP.

### Secondary / Future Users
- Exam-prep learners (IELTS/TOEFL)
- Developers / technical readers

These segments are not designed for in MVP and must not drive MVP feature decisions.

### Not Initially Targeted
- Absolute beginners (A0–A1)
- Users primarily seeking speaking/pronunciation practice

## 6. User Personas

**Minh — University Student** (primary segment)
Reads English articles and academic material for coursework. Currently uses Google Translate plus a notebook, inconsistently. Needs one-click, in-context capture and reminders/quizzes so vocabulary actually sticks.

**David — Self-Directed Young Adult Learner** (primary segment)
Consumes English news/blogs/social content daily. Uses a generic flashcard app with pre-made decks he finds irrelevant. Needs a vocabulary bank built from what he personally reads, with the original sentence preserved.

**Trang — Exam-Prep Candidate** *(secondary / future segment only — not designed for in MVP)*
Preparing for IELTS with a deadline. Needs structured, curriculum-driven, high-volume vocabulary coverage that exceeds what an incidental-capture MVP is meant to provide. Included here for context only; MVP requirements must not be shaped around her needs.

## 7. Jobs To Be Done

The following JTBD statements from Product Discovery drive MVP requirements:

- **JTBD-1:** When I'm reading something in English and hit a word or phrase I don't know, I want to understand what it means in that specific sentence, so I can keep reading without losing my train of thought. → Drives Extension contextual capture requirements (9.2).
- **JTBD-2:** When I've looked up a word, I want to save it along with the context it appeared in, so I can later remember not just the word but how it was used. → Drives Vocabulary Management requirements (9.3).
- **JTBD-3:** When I have a backlog of saved vocabulary, I want the system to tell me when to review it based on how well I've remembered it before, so I don't forget it. → Drives Flashcard Review requirements (9.4).
- **JTBD-4:** When I review vocabulary, I want to be tested, so I can verify I actually retained it. → Drives Quiz requirements (9.5).
- **JTBD-5:** When I look back at my learning, I want to see tangible progress, so I stay motivated. → Drives Dashboard requirements (9.6).

## 8. Core User Journey

1. User reads English content on a webpage.
2. User encounters unfamiliar text.
3. User selects the text.
4. Extension captures the selection and the minimum necessary surrounding context — **not the entire webpage**.
5. AI explains the meaning as used in that specific occurrence and provides an example.
6. User saves the vocabulary with its original context attached.
7. Saved vocabulary becomes available in the Web application.
8. User sees vocabulary due for review, scheduled based on past performance.
9. User reviews using flashcards.
10. User takes a multiple-choice quiz.
11. System evaluates the answer and provides correct/incorrect feedback plus an explanation.
12. System updates learning statistics.
13. User views progress on the dashboard.

The Extension must never scan or transmit an entire webpage at any point in this journey — only the explicit selection and the minimum context required to interpret it.

## 9. Functional Requirements

### 9.1 Authentication

- **FR-AUTH-001:** The system must allow a new user to register an account.
- **FR-AUTH-002:** The system must allow a registered user to log in.
- **FR-AUTH-003:** The system must allow an authenticated user to log out.
- **FR-AUTH-004:** The system must maintain an authenticated session so the user does not need to log in on every action within a session.
- **FR-AUTH-005:** The system must allow a user to perform basic account management (e.g., view account details).
- **FR-AUTH-006:** The system must require authentication before a user can save, view, review, or quiz on vocabulary.

*(Authentication technology and mechanism are explicitly not specified here — deferred to later technical phases.)*

### 9.2 Chrome Extension — Contextual Capture

- **FR-EXT-001:** The Extension must detect when a user selects text on a webpage.
- **FR-EXT-002:** The Extension must capture the exact selected text.
- **FR-EXT-003:** The Extension must capture only the minimum surrounding context necessary to interpret the selected text — it must not capture the entire webpage.
- **FR-EXT-004:** The Extension must send the selected text and minimum context to the AI service for contextual analysis.
- **FR-EXT-005:** The Extension must display an AI-generated, context-appropriate meaning/explanation of the selected text as used in that specific occurrence (not a generic dictionary definition).
- **FR-EXT-006:** The Extension must display an AI-generated example related to the selected occurrence.
- **FR-EXT-007:** The Extension must allow the user to save the vocabulary item, including its original context, with one action.
- **FR-EXT-008:** The Extension must provide a way to open the saved vocabulary (or the broader vocabulary bank) in the Web application.
- **FR-EXT-009:** The Extension must show a loading state while awaiting the AI response.
- **FR-EXT-010:** The Extension must show a clear failure state if the AI request fails, and must not silently fail.
- **FR-EXT-011:** The Extension must show a clear failure state if saving the vocabulary fails, and must not silently discard user input.
- **FR-EXT-012 (Privacy Boundary):** The Extension must only process user-selected text, the minimum surrounding context necessary for interpretation, and metadata explicitly required by the product. The Extension must NOT passively scan, monitor, or transmit entire webpages, at any time, for any reason.

### 9.3 Vocabulary Management

- **FR-VOCAB-001:** The system must allow a user to view their saved vocabulary.
- **FR-VOCAB-002:** The system must allow a user to view vocabulary grouped by vocabulary item (word/phrase).
- **FR-VOCAB-003:** The system must allow a user to view an individual saved occurrence, including its original context.
- **FR-VOCAB-004:** The system must allow a user to edit a saved vocabulary entry.
- **FR-VOCAB-005:** The system must allow a user to delete a saved vocabulary entry.
- **FR-VOCAB-006:** The system must preserve the original context of a saved vocabulary entry unless the user explicitly edits or removes it.
- **FR-VOCAB-007:** The system must conceptually support that the same vocabulary item can have multiple distinct meanings, each tied to a different original occurrence/context (e.g., "scale" meaning different things in different saved sentences). This is a product-level requirement only — no database schema is defined here.

### 9.4 Flashcard Review

- **FR-REVIEW-001:** The system must show the user vocabulary that is currently due for review.
- **FR-REVIEW-002:** The system must display the vocabulary item and its original context during a flashcard review.
- **FR-REVIEW-003:** The system must allow the user to reveal or check the meaning associated with a flashcard.
- **FR-REVIEW-004:** The system must record the user's review performance (e.g., whether the item was remembered) for each reviewed item.
- **FR-REVIEW-005:** The system must schedule the next review of a vocabulary item based on the user's recorded review performance. The specific scheduling algorithm is not defined in this PRD and is deferred to a later technical design phase.

### 9.5 Multiple-Choice Quiz

- **FR-QUIZ-001:** The system must generate quizzes composed of multiple-choice questions only.
- **FR-QUIZ-002:** Each quiz question must present exactly four answer options.
- **FR-QUIZ-003:** The system must allow the user to select one answer per question.
- **FR-QUIZ-004:** The system must evaluate the selected answer as correct or incorrect.
- **FR-QUIZ-005:** The system must display the correct/incorrect result to the user immediately after they answer.
- **FR-QUIZ-006:** The system must display an explanation for the correct answer after the user responds.
- **FR-QUIZ-007:** The system must record the result of each quiz question.
- **FR-QUIZ-008:** The system must update the user's learning statistics based on quiz results.

No other quiz types are in scope for MVP.

### 9.6 Dashboard

- **FR-DASH-001:** The dashboard must show the count of vocabulary currently due for review.
- **FR-DASH-002:** The dashboard must show recent learning activity (e.g., recent saves, reviews, or quizzes).
- **FR-DASH-003:** The dashboard must show basic learning statistics (e.g., total vocabulary saved, total reviewed).
- **FR-DASH-004:** The dashboard must show recent quiz results.
- **FR-DASH-005:** The dashboard must show progress over time to the extent supported by the approved MVP scope (e.g., simple trend of activity), without introducing advanced analytics beyond what Product Discovery approved.

The dashboard must remain basic for MVP; it is not a full analytics suite.

### 9.7 Settings

- **FR-SETTINGS-001:** The system must allow a user to view and update basic account/learning settings relevant to MVP (e.g., preferences directly supporting the approved learning loop).
- **FR-SETTINGS-002:** The system must not introduce complex customization features beyond what is necessary to support the approved MVP loop.

## 10. AI Requirements

**AI responsibilities:**
- Context-aware meaning/explanation of a selected occurrence (FR-EXT-005).
- Example generation for a selected occurrence (FR-EXT-006).
- Multiple-choice quiz question generation (supports FR-QUIZ-001).

**Non-AI (deterministic) responsibilities:**
- Authentication (9.1)
- Vocabulary storage and CRUD (9.3)
- Review scheduling logic (9.4)
- Statistics calculation (9.6)
- Quiz scoring (evaluating a selected answer, FR-QUIZ-004)
- Settings (9.7)

**Constraint:** This PRD must not, and does not, lock the product to a specific AI provider or model. AI provider/model selection is an open decision (see Section 18).

## 11. Privacy and Data Handling Requirements

- **FR-PRIV-001:** Only user-selected text may initiate vocabulary capture; the system must never initiate capture from unselected page content.
- **FR-PRIV-002:** Only the minimum necessary surrounding context required to interpret the selection may be captured alongside it.
- **FR-PRIV-003:** The system must not passively scan entire webpages.
- **FR-PRIV-004:** The system must not transmit entire webpages to the AI service by default.
- **FR-PRIV-005:** The user must be able to understand, at a product level, what content is being processed when they use the Extension (e.g., that only their selection and minimal context are sent).
- **FR-PRIV-006:** Detailed data retention and privacy policy specifics are not finalized in this PRD and remain an open decision to be resolved before launch (see Section 18).

No legal requirements beyond what Product Discovery supports are introduced here.

## 12. Error and Edge Cases

The system must define expected product-level behavior (not implementation) for:

- **EDGE-001:** No text is selected when the user attempts to trigger capture — the Extension should not attempt an AI request.
- **EDGE-002:** Selected text is too short or ambiguous to interpret meaningfully — the system should indicate that more context or a different selection is needed.
- **EDGE-003:** Captured context is insufficient for the AI to produce a reliable explanation — the system should indicate uncertainty rather than presenting a low-confidence answer as authoritative.
- **EDGE-004:** The AI request fails (e.g., timeout, service error) — the user must see a clear failure state and be able to retry.
- **EDGE-005:** The AI returns unusable or malformed content — the system must not save or display it as a valid explanation.
- **EDGE-006:** Saving a vocabulary item fails — the user must be informed and not lose their captured input silently.
- **EDGE-007:** The user is not authenticated when attempting an action that requires authentication — the system must prompt for authentication rather than failing silently or partially completing the action.
- **EDGE-008:** The network connection fails during any capture, save, review, or quiz action — the user must see a clear indication of the failure.
- **EDGE-009:** Quiz generation fails (e.g., insufficient vocabulary to generate meaningful questions) — the system must inform the user rather than presenting a broken or empty quiz.
- **EDGE-010:** No vocabulary is currently due for review — the dashboard/review screen must communicate this clearly rather than showing an empty or confusing state.
- **EDGE-011:** The user has no saved vocabulary at all (new user) — the system must guide the user toward the capture flow rather than showing an empty, unexplained screen.

## 13. Success Metrics

Per approved Product Discovery, MVP success will be evaluated using:

- Vocabulary items saved per active user per week.
- Percentage of saved vocabulary reviewed at least once within 7 days — the **loop-closure rate**, identified as the most important MVP validation metric.
- Quiz completion rate (started vs. finished).
- Weekly active learners (users completing at least one review or quiz session).
- Extension-to-Web conversion rate.
- Week 2 retention.
- Week 4 retention.

No numeric targets are defined in this PRD; targets should be set once initial usage data exists.

## 14. Product Hypotheses

The MVP exists to validate, not assume, the following:

1. Reducing friction when looking up vocabulary increases the number of vocabulary items users save.
2. Preserving the original context makes vocabulary review more meaningful.
3. Connecting vocabulary capture with scheduled review and quizzes increases the percentage of saved vocabulary that users actually review.
4. Users prefer vocabulary generated from their own real-world content over generic, pre-made vocabulary lists.

These remain hypotheses to be tested against real usage, not proven facts guiding design as if settled.

## 15. Risks and Mitigations

| Risk | Mitigation (product-level) |
|---|---|
| AI meaning-in-context is inconsistent, wrong, or context sent is insufficient to disambiguate | Allow users to edit saved meanings; require minimum-context capture logic to be tuned carefully (technical tuning deferred) |
| AI API cost scales faster than usage justifies | Product should support caching of repeated occurrence lookups and rate-limiting (mechanism deferred to technical design) |
| Privacy concerns from Extension reading webpage content | Enforce the Extension privacy boundary (FR-EXT-012, FR-PRIV-001–004) strictly; maintain a clear privacy policy |
| Users save vocabulary but never review it (loop-closure failure) | Make review prompts and due-vocabulary visibility prominent and low-friction (FR-DASH-001, FR-REVIEW-001) |
| Feature scope creep beyond MVP | Enforce the Must/Should/Could/Out-of-Scope boundaries in Section 16 and the Non-Goals in Section 4 |
| Chrome Extension technical limitations (blocked content scripts, native PDF viewers, some SPAs) | Scope MVP to standard HTML pages; document unsupported page types (specific list deferred to technical phase) |
| User abandons the loop after initial novelty | Performance-based review scheduling (FR-REVIEW-005) plus basic progress visibility (Section 9.6) to support habit formation |
| Ambiguity in "same word, different meaning" handling frustrates users | Treat vocabulary item / meaning / occurrence as an explicit product concept (FR-VOCAB-007) even though the database representation is deferred |

## 16. MVP Requirements Summary

**Must Have:**
- Authentication (FR-AUTH-001–006)
- Chrome Extension contextual capture, including the privacy boundary (FR-EXT-001–012)
- Minimum-context AI explanation and example generation
- Vocabulary saving with original context (FR-VOCAB-001–007)
- Web vocabulary management
- Flashcard review (FR-REVIEW-001–005)
- Performance-based review scheduling
- Multiple-choice quiz (FR-QUIZ-001–008)
- Basic dashboard (FR-DASH-001–005)
- Basic settings (FR-SETTINGS-001–002)

**Should Have:**
- Vocabulary collections/tags
- Quiz history
- Richer learning statistics beyond dashboard basics

**Could Have:**
- Additional quiz types (beyond MVP scope, future consideration only)
- CSV/Anki export
- In-extension mini review

**Out of Scope:**
As listed in Section 4 (Non-Goals), per approved Product Discovery.

## 17. Requirement Traceability

| Product Problem | Product Goal | User Need / JTBD | Functional Requirement | Success Metric |
|---|---|---|---|---|
| Looking up a word interrupts reading flow | G1 | JTBD-1 | FR-EXT-001–006 | Vocabulary saved per active user/week |
| Looked-up words are not saved durably | G2 | JTBD-2 | FR-EXT-007, FR-VOCAB-001–007 | Vocabulary saved per active user/week |
| Saved words are rarely reviewed again | G3, G4 | JTBD-3 | FR-REVIEW-001–005, FR-DASH-001 | Loop-closure rate (% reviewed within 7 days) |
| No feedback on whether a word was actually learned | G4 | JTBD-4 | FR-QUIZ-001–008 | Quiz completion rate |
| No visibility into progress | G5 | JTBD-5 | FR-DASH-001–005 | Weekly active learners; retention (week 2/4) |
| Vocabulary loses original context / same word has different meanings | G2 | JTBD-2 | FR-VOCAB-003, FR-VOCAB-006, FR-VOCAB-007 | Loop-closure rate; (qualitative) Hypothesis 2 validation |
| Multi-tool workflow increases friction | G1 | JTBD-1 | FR-EXT-001–011 | Extension-to-Web conversion |

## 18. Open Decisions

The following remain unresolved and are explicitly deferred to later phases — this PRD does not resolve them:

- AI provider/model selection — deferred to technical/architecture phase.
- Specific review-scheduling algorithm (e.g., SM-2 or otherwise) — deferred to Architecture/Technical Design phase.
- Data model for vocabulary item / meaning / occurrence — deferred to Architecture and Database Design phase.
- Supported website scope (all websites vs. curated allowlist) — deferred to later product/technical decision.
- Authentication method(s) — deferred to technical design phase.
- Monetization model (free/freemium/subscription) — deferred to business/product decision.
- Data retention and privacy policy specifics — deferred to legal/product decision before launch.

## 19. PRD Acceptance Criteria

This PRD satisfies the following checks:

- [x] Every MVP Must Have feature from Product Discovery is represented (Section 16, Section 9).
- [x] No approved Out-of-Scope feature has been added (Section 4).
- [x] Primary target audience remains university students / young adult B1–B2 learners, as one unified segment (Section 5).
- [x] MVP quiz remains multiple-choice only (Section 9.5).
- [x] Context preservation is a core requirement (FR-VOCAB-003, FR-VOCAB-006).
- [x] Extension privacy boundary is explicit (FR-EXT-012, Section 11).
- [x] Performance-based review is required but no SRS algorithm is selected (FR-REVIEW-005, Section 18).
- [x] Vocabulary item / meaning / occurrence remains a conceptual distinction without prescribing database design (FR-VOCAB-007).
- [x] AI responsibilities and deterministic responsibilities are clearly separated (Section 10).
- [x] Success metrics match Product Discovery (Section 13).
- [x] Product hypotheses remain framed as hypotheses (Section 14).
- [x] No technical architecture, database schema, API contract, or implementation code is introduced anywhere in this document.
