## Product Discovery — LinguaFlow

### 1. Product Overview

LinguaFlow is an AI-assisted English learning system composed of a Chrome Extension (contextual capture layer) and a Web application (management, review, and practice layer). The extension lets users turn real, unstructured English content into vocabulary the moment they encounter it; the web app schedules review and tests retention. The product's core differentiator is that vocabulary is never learned in isolation — it always carries the original context in which it was encountered, and only the minimum context needed for that meaning is captured, never entire pages.

### 2. Problem Statement

- English learners regularly encounter unfamiliar words or sentences while reading real content but have no lightweight way to capture and later relearn them.
- Existing methods are fragmented: a translation tool for meaning, notes for storage, a separate flashcard app for review — each hop loses context and momentum, so most looked-up words are never revisited.
- Generic word-list apps teach vocabulary divorced from the sentence, tone, and situation where it appeared, weakening retention and making it harder to apply the word correctly later.
- Switching tabs/apps to look something up interrupts the reading task, discouraging learners from looking words up at all.
- Learning from real-world context is valuable because relevance and personal encounter both plausibly improve recall, and the vocabulary matches the user's actual goals — this is a reasoned hypothesis the MVP is designed to test (see Product Hypotheses), not a proven market claim.

### 3. Product Vision

**Vision statement:** LinguaFlow becomes the bridge between "encountering English in the wild" and "actually retaining it" — every word a user looks up becomes a durable, testable piece of vocabulary rather than a forgotten tooltip.

**Value proposition:** Instead of learning vocabulary from someone else's list, learn from your own reading — capture it in context with minimal friction, and be scheduled for review and quizzing later without extra effort.

**Core learning loop:**

Encounter unknown word/sentence → select it with minimum necessary surrounding context → AI explains its meaning *as used in that occurrence* + gives an example → save with original context attached → review via spaced repetition scheduled by past performance → practice via multiple-choice quiz → track progress.

### 4. Target Users

**Primary target user (MVP):** University students and young adult English learners at B1–B2 who regularly read English content online. This is a single, unified MVP audience — the product does not build separate experiences, flows, or UI paths for different segments within this group.

**Secondary / future target users:**

- Exam-prep learners (IELTS/TOEFL) — valuable once quiz variety and exam-aligned features exist.
- Developers/technical readers — a strong niche once domain-specific vocabulary handling is added.

**Users not targeted initially:**

- Absolute beginners (A0–A1): the core loop assumes the user can read most of a sentence and is missing specific words, not that they need foundational grammar instruction.
- Users seeking speaking/pronunciation practice: entirely out of scope for MVP capability set.

### 5. Personas

**Persona 1 — Minh, the University Student**

- Background: 20, undergraduate, reads English articles and academic material for coursework.
- Goal: Build academic vocabulary without extra dedicated study time.
- Pain points: Keeps a messy note app of words; rarely reviews them; loses track of what she already "knows."
- Current behavior: Google Translate + a notebook, sporadically.
- Motivation: Better grades and general English improvement.
- Frustrations: Copy-pasting into Translate breaks reading flow; no way to test herself later.
- Expected value: One-click, in-context capture while reading, plus reminders/quizzes so saved words stick.

**Persona 2 — David, the Self-Directed Young Adult Learner**

- Background: 24, works entry-level, consumes English news/blogs/social content daily for personal growth.
- Goal: Expand everyday/professional vocabulary naturally.
- Pain points: Learns a word, forgets it within days; generic flashcard decks feel disconnected from what he actually reads.
- Current behavior: Uses a flashcard app with pre-made decks he finds irrelevant.
- Motivation: Long-term fluency, not a specific exam.
- Frustrations: Pre-made decks don't reflect his real vocabulary gaps; a word can mean different things in different places and generic decks don't capture that.
- Expected value: A vocabulary bank built from what he personally reads, with the actual sentence preserved, so review feels relevant.

**Persona 3 — Trang, the Exam-Prep Candidate** *(secondary segment, included for contrast only)*

- Background: 24, preparing for IELTS in 3 months.
- Goal: Rapidly expand test-relevant vocabulary with measurable progress.
- Note: She is illustrative of a future segment, not someone MVP is designed around — her need for structured, curriculum-driven content exceeds what an incidental-capture MVP provides.

### 6. Jobs To Be Done

- When I'm reading something in English and hit a word or phrase I don't know, I want to understand what it means *in that specific sentence*, so I can keep reading without losing my train of thought.
- When I've looked up a word, I want to save it along with the context it appeared in, so I can later remember not just the word but how it was actually used.
- When I have a backlog of saved vocabulary, I want the system to tell me when to review it based on how well I've remembered it before, so I don't forget words I already spent effort learning.
- When I review vocabulary, I want to be tested with a quiz, so I can verify I actually retained it.
- When I look back at my learning, I want to see tangible progress, so I stay motivated to continue.

### 7. User Problems

| ProblemImpactFrequencyPriority                                                                  |        |           |    |
| ----------------------------------------------------------------------------------------------- | ------ | --------- | -- |
| Looking up a word interrupts reading flow (tab-switching to translator)                         | High   | Very High | P0 |
| Looked-up words are not saved anywhere durable                                                  | High   | Very High | P0 |
| Saved words are rarely reviewed again (no scheduled prompt)                                     | High   | High      | P0 |
| Vocabulary loses its original context when saved generically                                    | Medium | High      | P1 |
| Same word can mean different things in different contexts, but tools treat it as one flat entry | Medium | Medium    | P1 |
| No feedback on whether a word was actually learned (no testing)                                 | Medium | Medium    | P1 |
| No visibility into overall progress/motivation over time                                        | Medium | Medium    | P2 |
| Multi-tool workflow (translator + notes + flashcards) increases friction to even start          | High   | Medium    | P1 |

### 8. Core Product Value

1. **Zero-friction contextual capture** — turning a lookup on any webpage into a saved, context-attached vocabulary entry in one flow, without switching apps and without collecting more than the minimum text needed.
2. **Context-preserving, occurrence-aware learning** — every saved item retains the specific sentence/situation it came from, and the product conceptually distinguishes a word from its meaning-in-context, so review and quizzes test real usage rather than a flattened dictionary definition.
3. **Closed-loop retention** — capture is deliberately connected to performance-based scheduled review and quizzing, so vocabulary collected is systematically revisited rather than accumulating as a dead list.

### 9. Core User Journey

1. User is reading a webpage and encounters an unfamiliar word or sentence.
2. User selects the text; the extension captures the selection plus the minimum surrounding context needed to interpret it (not the whole page).
3. AI analyzes the occurrence and returns a context-appropriate meaning/explanation plus an example — not a generic dictionary definition of the isolated word.
4. User saves the vocabulary with its original context attached, in one click.
5. User opens the Web app dashboard and sees vocabulary due for review, scheduled according to their past review performance.
6. User reviews via flashcards.
7. User takes a multiple-choice quiz built from due/recent vocabulary; each question shows correct/incorrect feedback and an explanation.
8. User sees updated learning statistics (words saved, reviewed, quiz results, progress over time).

### 10. MVP Scope

#### Must Have

- **Chrome Extension:** select text → capture selection + minimum necessary surrounding context → AI returns context-appropriate meaning + example → save vocabulary (with context) in one click.
- **Web App:** authentication, vocabulary management (view/edit/delete, viewable by word and by occurrence/context), flashcard review, spaced-repetition-style scheduling driven by review performance, multiple-choice quiz (question → 4 options → select → evaluate → show correct/incorrect + explanation → update stats), basic dashboard (due-for-review count, recent activity), basic settings.
- Rationale: this is the minimum set that completes the full loop (capture → save with context → schedule → review → quiz → track). Removing any step breaks the value proposition.

#### Should Have

- Vocabulary collections/tags.
- Quiz history (list of past quizzes and scores).
- Learning statistics beyond dashboard basics (trends over time).

#### Could Have

- Additional quiz types beyond multiple-choice.
- Export vocabulary (CSV/Anki).
- In-extension mini review (quick flashcard popup without opening the web app).

#### Out of Scope (MVP)

- Fill-in-the-blank, listening, writing, and speaking quiz types.
- YouTube/Netflix/subtitle learning, dictation, shadowing, speaking/pronunciation practice, AI conversation, personalized learning paths, PDF/article/full-passage learning, AI summarization.
- Rationale unchanged: these are separate content-ingestion or interaction modalities that would dilute focus before the core loop is validated.

### 11. Web vs Chrome Extension Responsibilities

**Chrome Extension (contextual capture only):**

- Detect text selection on any webpage.
- Capture the selection plus only the minimum surrounding context required to interpret it.
- Request AI meaning-in-context + example for that specific occurrence.
- Show a lightweight popup UI.
- Save vocabulary (with context) to the user's account.
- Link to "open in LinguaFlow" for deeper review.
- Must NOT read, scan, or transmit page content beyond the selection and its minimum required context.

**Web Application (management, review, and progress):**

- Authentication and account management.
- Full vocabulary CRUD, viewable across items/meanings/contexts, collections and organization.
- Flashcards and performance-based review scheduling engine.
- Multiple-choice quiz generation, taking, scoring, and history.
- Dashboard and learning statistics.
- Settings.

No duplication: the extension never manages review scheduling or shows statistics; the web app never handles in-page text selection.

### 12. AI vs Non-AI Responsibilities

**AI:**

- Context-aware meaning/explanation of the selected occurrence (not isolated-word translation).
- Example sentence generation.
- Quiz question generation from saved vocabulary.

**Non-AI (deterministic):**

- Authentication.
- Vocabulary storage and CRUD.
- Review scheduling logic (performance-based; specific algorithm deferred — see Assumptions/Open Questions).
- Statistics/metrics calculation.
- Settings and preferences.
- Quiz scoring (checking a multiple-choice answer is deterministic).

### 13. Initial User Stories

- As an English learner, I want to select an unknown word or phrase on a webpage so that I can understand it without leaving the page.
- As an English learner, I want the explanation to reflect how the word is used in that specific sentence, not just a generic dictionary definition.
- As an English learner, I want to save a word along with its original context in one click, so I don't lose the sentence that made it meaningful.
- As an English learner, I want to see that the same word can have different saved meanings from different contexts, so my vocabulary reflects real usage.
- As an English learner, I want to review my saved vocabulary using flashcards so that I can reinforce what I've learned.
- As an English learner, I want the system to tell me when to review based on how well I remembered something last time, so I don't forget vocabulary I already saved.
- As an English learner, I want to take a multiple-choice quiz on my saved vocabulary, see whether I got it right, and see an explanation, so I can verify I actually remember it.
- As an English learner, I want to see basic statistics about my learning activity so that I stay motivated.
- As an English learner, I want to log in securely so my vocabulary is saved to my account across devices.

### 14. Success Metrics

- Vocabulary items saved per active user per week.
- % of saved vocabulary reviewed at least once within 7 days (loop-closure rate — the most direct test of Hypothesis 3).
- Quiz completion rate (started vs. finished).
- Weekly active learners (any review or quiz session).
- Extension-to-Web conversion (% of extension savers who later log into the web app).
- Retention: % of users still active at week 2 and week 4.

No numeric targets are proposed; these should be set once initial usage data exists.

### 15. Risks

| RiskImpactLikelihoodMitigation                                                                           |             |        |                                                                                                                           |
| -------------------------------------------------------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| AI meaning-in-context is inconsistent, wrong, or the context window sent is insufficient to disambiguate | High        | Medium | Use a strong LLM; allow users to edit saved meanings; tune "minimum necessary context" heuristics carefully               |
| AI API cost scales faster than usage justifies                                                           | Medium-High | Medium | Cache repeated occurrence lookups, rate-limit free tier, batch quiz generation                                            |
| Privacy concerns from extension reading webpage content                                                  | High        | Medium | Enforce the extension privacy boundary (selection + minimum context only, never full-page scanning); clear privacy policy |
| Core learning value doesn't materialize (users save but never review)                                    | High        | High   | Central hypothesis risk; track loop-closure metric closely; make review prompts low-friction from day one                 |
| Feature scope creep beyond MVP                                                                           | Medium      | High   | Enforce Must/Should/Could/Out-of-scope and Product Boundaries explicitly during build                                     |
| Chrome Extension technical limitations (blocked content scripts, native PDF viewers, some SPAs)          | Medium      | Medium | Scope MVP to standard HTML pages; document unsupported page types                                                         |
| User abandons the loop after initial novelty                                                             | High        | High   | Performance-based review scheduling plus simple goal-setting to build habit                                               |
| Ambiguity in "same word, different meaning" handling frustrates users if not designed carefully          | Medium      | Medium | Treat as an explicit domain concept now (see Vocabulary Domain Note) even though schema is deferred                       |

### 16. Assumptions

**Confirmed information:**

- Product includes both a Web app and a Chrome Extension.
- Primary MVP user: university students and young adult B1–B2 learners, as one unified segment (no per-segment experiences in MVP).
- MVP quiz type is multiple-choice only.
- Review scheduling must be performance-based, but the specific algorithm is not chosen at this stage.
- Extension must never passively scan or collect whole webpages — only selection + minimum necessary context + explicitly required metadata.

**Product assumptions (reasoned, not confirmed):**

- Users primarily read English content in a standard browser tab (not PDF viewers or native apps) for MVP.
- A single quiz type is sufficient to validate the learning loop before adding variety.
- Users are more motivated by personal progress stats than social/competitive features (no leaderboard assumed for MVP).

**Decisions still requiring human input:**

- Monetization model (free, freemium, subscription).
- Choice of AI provider/model.
- Choice of specific review-scheduling algorithm (deferred to Architecture/Technical Design phase).
- Data modeling approach for vocabulary item vs. meaning vs. occurrence (deferred to Architecture and Database Design phase).
- Supported website scope (all websites vs. curated allowlist).
- Authentication method(s).
- Data retention and privacy policy specifics.

### 17. Open Questions

- What English proficiency assumptions should drive UI/content complexity (confirmed as B1–B2, but exact calibration TBD)?
- Should MVP prioritize Web or Extension build sequencing, or build both in parallel?
- Which AI provider/model, and what's the cost ceiling per user?
- Free, freemium, or subscription at launch?
- Which specific review-scheduling algorithm will be implemented (technical decision, not product-level)?
- Which specific data model will represent vocabulary item / meaning / occurrence (technical decision, not product-level)?
- Should MVP support all websites or a limited/curated set?
- What is the exact data privacy/retention policy for selected text and context?
- What authentication method(s) should launch with?

Provisional assumptions are stated above so discovery isn't blocked; these should be confirmed before PRD.

### Product Boundaries

LinguaFlow explicitly does **not** attempt to be, in MVP or by underlying design intent:

- A general-purpose translator (it explains meaning-in-context for learning purposes, not bulk/arbitrary translation).
- A full AI tutor or conversation partner.
- A speaking or pronunciation practice platform.
- A YouTube/Netflix/video or subtitle learning platform.
- A generic note-taking application.
- A passive webpage monitoring or full-page content-scanning tool — it only ever processes what the user explicitly selects plus the minimum context needed.

These boundaries exist specifically to prevent feature creep and to keep the Extension's data-handling scope narrow and defensible on privacy grounds.

### Product Hypotheses

The MVP exists to validate these hypotheses, not to assume them as proven:

**Hypothesis 1:** Reducing friction when looking up vocabulary increases the number of vocabulary items users save.

**Hypothesis 2:** Preserving the original context makes vocabulary review more meaningful (and improves retention/recall vs. context-free definitions).

**Hypothesis 3:** Connecting vocabulary capture with scheduled review and quizzes increases the percentage of saved vocabulary that users actually review.

**Hypothesis 4:** Users prefer vocabulary generated from their own real-world content over generic, pre-made vocabulary lists.

### 18. Recommended Product Direction

Build MVP around one tightly-scoped, occurrence-aware loop: select → capture minimum context → AI explains meaning-in-context + example → save with context → performance-based scheduled review → multiple-choice quiz → track progress — for a single unified primary audience (university students / young adult B1–B2 learners). Treat "vocabulary item vs. meaning vs. context" as a real conceptual distinction from day one, even though its database representation is deferred to Architecture. Keep the extension strictly bounded to selection-plus-minimum-context (a privacy and scope boundary, not just an implementation detail). Defer algorithm choices (SRS scheduling) and all future content modalities (video, PDF, speaking, summarization) — MVP succeeds if it validates the full loop end-to-end, not if it covers every English-learning use case.

#### Product Decision Summary

- **Primary user:** University students and young adult English learners (B1–B2) who regularly read English content online — one unified MVP segment, no per-segment product variants.
- **Core problem:** Vocabulary encountered in real content is looked up but rarely saved with context and almost never reviewed, due to fragmented tools and lost meaning-in-context.
- **Core solution:** A Chrome Extension for minimal-context, meaning-in-context capture, connected to a Web app that manages performance-based review and multiple-choice testing.
- **Core learning loop:** Encounter → select (minimum context captured) → AI explains meaning-in-context + example → save with context → scheduled review (performance-based) → multiple-choice quiz → track progress.
- **MVP:** Auth, vocabulary management (item/meaning/context-aware), flashcards + performance-based scheduling, multiple-choice quiz with explanations, basic dashboard/stats, settings (Web); minimum-context selection popup with AI explanation/example + save (Extension).
- **Out of scope:** Non-multiple-choice quiz types (fill-in-blank, listening, writing, speaking); YouTube/Netflix/subtitle learning, dictation, shadowing, speaking/pronunciation, AI conversation, personalized paths, PDF/article/passage learning, summarization.
- **Product boundaries:** Not a general-purpose translator, not a full AI tutor, not a speaking platform, not a video-learning platform, not a note-taking app, not a passive webpage-scanning tool.
- **Product hypotheses:** (1) less friction → more saves; (2) preserved context → more meaningful review; (3) capture+scheduled review/quiz → higher review rate of saved vocabulary; (4) users prefer self-sourced vocabulary over generic decks.
- **Biggest risks:** Loop-closure failure (saved but never reviewed); AI accuracy/cost; scope creep; privacy handling of selected context.
- **Decisions deferred to later technical/design phases:** Specific review-scheduling algorithm; data model for vocabulary item vs. meaning vs. occurrence; AI provider/model selection; monetization model; supported-website scope; authentication method(s); data retention/privacy policy specifics.
