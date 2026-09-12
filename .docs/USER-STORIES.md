# User Stories & Acceptance Criteria — LinguaFlow

## 1. Document Overview

- **Purpose:** This document converts the analyzed requirements in `docs/REQUIREMENTS.md` into Epics, User Stories, and Acceptance Criteria, with full traceability back to `docs/PRODUCT-DISCOVERY.md` and `docs/PRD.md`, so the next implementation phase can work from these stories without reinterpreting the original product documents.
- **Source documents (in order of authority):** `docs/PRODUCT-DISCOVERY.md` → `docs/PRD.md` → `docs/REQUIREMENTS.md`. This document does not override any of them.
- **Scope:** Requirements/product-analysis phase only. No application code, database schema, API design, or technical architecture is introduced here.
- **Status:** Draft, pending review. Several stories are intentionally incomplete (marked Needs Product Decision or Deferred) because their source requirement carries that same status in `REQUIREMENTS.md`.
- **Relationship to prior documents:** No new product scope is introduced anywhere in this document. Every User Story traces to an existing FR-*, REQ-AI-*, or EDGE-* requirement. Where a requirement is not yet fully specified, the corresponding story is marked accordingly rather than guessed.
- **A note on unresolved items:** Per the task's own instruction, this document does not resolve `REQUIREMENTS.md`'s open Ambiguities (AMB-*) or Decision Log (DEC-*) items. Stories tied to those items carry the same "Needs Product Decision" or "Deferred" status until the product owner resolves them.

### 1.1 Source Document Consistency Note (reported, not silently resolved)

`REQUIREMENTS.md` itself contains two internal inconsistencies that affect how this document assigns Priority and Readiness. Both are reported here rather than resolved unilaterally:

1. **Priority inconsistency:** Section 10.2 of `REQUIREMENTS.md` (labeled as the "corrected" priority model, which explicitly removed the old `P0*` notation) states that *all* of FR-AUTH-001–006, FR-EXT-001–012, FR-VOCAB-001–007, FR-REVIEW-001–005, FR-QUIZ-001–008, FR-DASH-001–005, and FR-SETTINGS-001–002 are **P0**. However, the per-requirement tables in Section 8 and the Traceability Matrix in Section 18 of the same document still list several of these (FR-AUTH-005, FR-EXT-008, FR-VOCAB-004, FR-DASH-005, FR-SETTINGS-001/002) as **P1** — an apparent artifact of an incomplete edit. This document follows Section 10.2 (the explicitly "corrected" model, and the one the task instructs this phase to use) and treats **all** of the above as **Priority: P0**, with Readiness tracked separately per item. This does not change product scope — PRD §16 already places all of these in the Must-Have set.
2. **Readiness-label inconsistency:** Section 14 (Ambiguities) and Section 19 (Decision Log) of `REQUIREMENTS.md` consistently label every open ambiguity (AMB-01 through AMB-09) as **"Needs Product Decision."** Section 17 (Acceptance Criteria Readiness) of the same document instead labels several of these same items as **"Needs Clarification."** Since a formal Decision Log entry (DEC-01 through DEC-08) exists for each of these ambiguities, this document treats any story tied to a logged DEC-* item as **Readiness: Needs Product Decision**, consistent with Sections 14 and 19. This is a labeling alignment, not a new decision.

Neither correction changes what is in or out of MVP scope; both are restatements of what `REQUIREMENTS.md` already establishes, chosen to resolve an internal inconsistency in that document rather than to introduce a new judgment call.

## 2. User Story & Acceptance Criteria Format

Every User Story in this document uses the required format (Epic, As a/I want to/So that, Priority, Readiness, Source Requirement(s), Dependencies, Notes). Every **Ready** story has concrete Given/When/Then Acceptance Criteria. Stories marked **Needs Product Decision** or **Deferred** do not have finalized Acceptance Criteria — inventing them would silently resolve an open product decision — and instead state explicitly what is blocking them.

## 3. Epics

| Epic | Name | Story Range |
|---|---|---|
| EPIC-01 | Authentication | US-001–US-006 |
| EPIC-02 | Extension — Contextual Capture | US-007–US-018 |
| EPIC-03 | Vocabulary Management | US-019–US-026 |
| EPIC-04 | Flashcard Review | US-027–US-031 |
| EPIC-05 | Multiple-Choice Quiz | US-032–US-039 |
| EPIC-06 | Dashboard | US-040–US-044 |
| EPIC-07 | Settings | US-045 |
| EPIC-08 | Privacy & Data Handling | US-046–US-051 |
| EPIC-09 | AI Capabilities | US-052–US-054 |
| EPIC-10 | Error & Edge Cases | US-055–US-059 |

No epics beyond the ten specified were created. All 59 stories are **Priority: P0**, since every source FR-*, REQ-AI-*, and EDGE-* requirement they trace to sits in the PRD's Must-Have set (per the Section 10.2 correction above). No P1/P2 stories are created in this document — the PRD's Should-Have and Could-Have items (collections/tags, quiz history, richer statistics, additional quiz types, export, in-extension mini review) do not yet have assigned FR-IDs in `REQUIREMENTS.md`, and creating stories for them now would invent scope ahead of a formal requirement.

---

## EPIC-01 — Authentication

### US-001 — Register a New Account

**Epic:** EPIC-01

**As a:** learner

**I want to:** register a new LinguaFlow account

**So that:** I have a place to save and manage my vocabulary

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-AUTH-001

**Dependencies:**
* None

#### Acceptance Criteria

**AC-01**
* Given: I do not yet have a LinguaFlow account
* When: I submit the required registration information
* Then: A new account is created and associated with me

**AC-02**
* Given: I have just registered
* When: Registration completes successfully
* Then: I am recognized as a valid, distinct account holder for all future actions

---

### US-002 — Log In

**Epic:** EPIC-01

**As a:** learner

**I want to:** log in to my account

**So that:** I can access my saved vocabulary and learning activity

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-AUTH-002

**Dependencies:**
* US-001

#### Acceptance Criteria

**AC-01**
* Given: I have a registered account
* When: I provide valid credentials
* Then: An authenticated session begins for me

**AC-02**
* Given: I provide invalid credentials
* When: I attempt to log in
* Then: I am not authenticated and remain unable to access account-gated features

---

### US-003 — Log Out

**Epic:** EPIC-01

**As a:** learner

**I want to:** log out of my account

**So that:** I can end my session securely

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-AUTH-003

**Dependencies:**
* US-002

#### Acceptance Criteria

**AC-01**
* Given: I am logged in
* When: I request to log out
* Then: My session ends and I can no longer access account-gated features until I log in again

---

### US-004 — Maintain an Authenticated Session

**Epic:** EPIC-01

**As a:** learner

**I want to:** stay logged in while I use the product

**So that:** I am not repeatedly asked to re-authenticate during normal use

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-AUTH-004

**Dependencies:**
* US-002

#### Acceptance Criteria

**AC-01**
* Given: I have successfully logged in
* When: I perform subsequent actions within the same session
* Then: I am not re-prompted to log in for each action

---

### US-005 — Basic Account Management

**Epic:** EPIC-01

**As a:** learner

**I want to:** view and manage basic details of my account

**So that:** I can keep my account information accurate

**Priority:** P0

**Readiness:** Needs Product Decision

**Source Requirement(s):**
* FR-AUTH-005

**Dependencies:**
* US-002

**Notes:**
`REQUIREMENTS.md` (AMB-03 / DEC-03) confirms "basic account management" is undefined — the specific set of account actions (e.g., view details only, vs. update profile fields, vs. change password, vs. delete account) has not been decided. Acceptance Criteria cannot be finalized until the product owner enumerates the specific MVP account actions (DEC-03). **Status: Blocked — Product Decision Required.**

---

### US-006 — Require Authentication for Vocabulary Actions

**Epic:** EPIC-01

**As a:** system

**I want to:** require authentication before any save, view, review, or quiz action

**So that:** vocabulary and learning data are always tied to a verified account owner

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-AUTH-006
* EDGE-007

**Dependencies:**
* US-002

#### Acceptance Criteria

**AC-01**
* Given: I am not authenticated
* When: I attempt to save, view, review, or quiz on vocabulary
* Then: The action is blocked and I am prompted to authenticate rather than having the action partially complete

**AC-02**
* Given: I am authenticated
* When: I perform a save, view, review, or quiz action
* Then: The action proceeds normally

---

## EPIC-02 — Extension — Contextual Capture

### US-007 — Detect Text Selection

**Epic:** EPIC-02

**As a:** learner

**I want to:** have the Extension detect when I select text on a webpage

**So that:** I can trigger vocabulary capture from any English content I'm reading

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-001

**Dependencies:**
* None

#### Acceptance Criteria

**AC-01**
* Given: The Extension is active on a webpage
* When: I select a word or phrase
* Then: The Extension recognizes that a selection has occurred

---

### US-008 — Capture the Exact Selected Text

**Epic:** EPIC-02

**As a:** learner

**I want to:** have the exact text I selected captured

**So that:** the vocabulary I save reflects precisely what I chose, not an approximation

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-002

**Dependencies:**
* US-007

#### Acceptance Criteria

**AC-01**
* Given: I have selected text on a webpage
* When: The Extension captures my selection
* Then: The captured text matches exactly what I selected, with no alteration

---

### US-009 — Capture Only the Minimum Necessary Surrounding Context

**Epic:** EPIC-02

**As a:** learner

**I want to:** have only the minimum context around my selection captured

**So that:** my vocabulary is interpretable without my browsing being over-collected

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-003
* FR-EXT-012 (privacy boundary reinforcement)

**Dependencies:**
* US-007

#### Acceptance Criteria

**AC-01**
* Given: I have selected text on a webpage
* When: The Extension captures context around my selection
* Then: Only the minimum surrounding context necessary to interpret the selection is captured

**AC-02**
* Given: The Extension is capturing context
* When: The capture completes
* Then: The captured data does not include the entire webpage's content

---

### US-010 — Send Selection and Context to AI for Analysis

**Epic:** EPIC-02

**As a:** learner

**I want to:** have my selection and its minimum context analyzed by AI

**So that:** I can get an explanation specific to how the text was actually used

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-004
* REQ-AI-001
* EDGE-001

**Dependencies:**
* US-008, US-009

#### Acceptance Criteria

**AC-01**
* Given: I have a captured selection and its minimum context
* When: I trigger the explanation flow
* Then: Exactly the selected text and its minimum context are sent for AI analysis — nothing more

**AC-02**
* Given: No text is currently selected
* When: I attempt to trigger the capture/explanation flow
* Then: No AI request is made

---

### US-011 — Show Context-Appropriate Meaning

**Epic:** EPIC-02

**As a:** learner

**I want to:** see the meaning of my selection as it's used in that specific sentence

**So that:** I understand real usage rather than a generic dictionary definition

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-005
* REQ-AI-001

**Dependencies:**
* US-010

#### Acceptance Criteria

**AC-01**
* Given: The AI analysis for my selection succeeds
* When: The result is returned
* Then: I see a meaning/explanation that reflects how the text is used in that specific occurrence

**Notes:**
Behavior for selections that are too short, too ambiguous, or backed by insufficient context to produce a reliable meaning is covered separately in US-056 (Epic-10), since the threshold for "insufficient" is an open product decision (AMB-05 / DEC-05) and is not invented here.

---

### US-012 — Show an AI-Generated Example

**Epic:** EPIC-02

**As a:** learner

**I want to:** see an example related to my selected occurrence

**So that:** I have a second reference point for how the word/phrase is used

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-006
* REQ-AI-002

**Dependencies:**
* US-010

#### Acceptance Criteria

**AC-01**
* Given: The AI analysis for my selection succeeds
* When: The result is returned
* Then: I see an example related to the selected occurrence alongside the meaning

---

### US-013 — Save Vocabulary with Original Context

**Epic:** EPIC-02

**As a:** learner

**I want to:** save the vocabulary item along with its original context in one action

**So that:** I don't lose the sentence that made it meaningful, and it becomes available for review later

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-007

**Dependencies:**
* US-006
* US-010

#### Acceptance Criteria

**AC-01**
* Given: I have selected an occurrence and have the capture context
* When: I trigger the save action
* Then: The vocabulary item, its meaning, and its original context are persisted to my account in a single action

**AC-02**
* Given: I have successfully saved a vocabulary item
* When: I later view my vocabulary (see US-019/US-021)
* Then: The saved item and its original context are retrievable

**Notes:**
Per `REQUIREMENTS.md`'s corrected dependency analysis, the source documents do **not** explicitly establish successful AI-generated meaning/example as a hard prerequisite for saving — it is described only as the normal flow, not a confirmed gate. This story's Acceptance Criteria describe the normal (documented) flow and do not assert or invent a rule about whether save is blocked if AI output is unavailable; that question is not resolved in the source documents and is not decided here.

---

### US-014 — Open Saved Vocabulary in the Web Application

**Epic:** EPIC-02

**As a:** learner

**I want to:** open the Web application from the Extension after saving

**So that:** I can continue to a deeper review experience

**Priority:** P0

**Readiness:** Needs Product Decision

**Source Requirement(s):**
* FR-EXT-008

**Dependencies:**
* US-013

**Notes:**
`REQUIREMENTS.md` (AMB-08 / DEC-07) leaves open whether this link should open a general vocabulary view or deep-link to the specific just-saved item. Acceptance Criteria cannot be finalized until this destination granularity is decided. **Status: Blocked — Product Decision Required.**

---

### US-015 — Show a Loading State While Awaiting AI

**Epic:** EPIC-02

**As a:** learner

**I want to:** see a loading indicator while the AI explanation is being generated

**So that:** I know the Extension is working and hasn't frozen

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-009

**Dependencies:**
* US-010

#### Acceptance Criteria

**AC-01**
* Given: I have triggered an AI explanation request
* When: The response has not yet returned
* Then: I see a visible loading/waiting state

**AC-02**
* Given: The AI response returns (success or failure)
* When: The response is received
* Then: The loading state is replaced by the result or failure state

---

### US-016 — Show a Clear AI Failure State

**Epic:** EPIC-02

**As a:** learner

**I want to:** be clearly informed if the AI explanation request fails

**So that:** I know to retry rather than assume the Extension is broken or silently ignoring me

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-010
* EDGE-004

**Dependencies:**
* US-010

#### Acceptance Criteria

**AC-01**
* Given: The AI request fails (timeout or error)
* When: I am waiting for a response
* Then: I see a clear failure indication rather than a silent or indefinite loading state

**AC-02**
* Given: I have seen an AI failure state
* When: I choose to retry
* Then: I am able to attempt the request again

---

### US-017 — Show a Clear Save Failure State

**Epic:** EPIC-02

**As a:** learner

**I want to:** be clearly informed if saving my vocabulary fails

**So that:** I don't lose my captured word/context without knowing it

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-011
* EDGE-006

**Dependencies:**
* US-013

#### Acceptance Criteria

**AC-01**
* Given: I trigger a save and it fails
* When: The failure occurs
* Then: I am clearly informed the save failed, and my captured input is not silently discarded

---

### US-018 — Enforce the Extension Privacy Boundary

**Epic:** EPIC-02

**As a:** learner

**I want to:** trust that the Extension only processes what I explicitly select

**So that:** my general browsing is never monitored or transmitted

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-EXT-012

**Dependencies:**
* US-008, US-009

#### Acceptance Criteria

**AC-01**
* Given: I am browsing a webpage without making a selection
* When: The Extension is active
* Then: No page content is captured, scanned, or transmitted

**AC-02**
* Given: I have made a selection and triggered capture
* When: Data is sent for AI analysis
* Then: Only the selected text, the minimum necessary context, and metadata explicitly required by the product are included — never the full page

---

## EPIC-03 — Vocabulary Management

### US-019 — View Saved Vocabulary

**Epic:** EPIC-03

**As a:** learner

**I want to:** view my saved vocabulary

**So that:** I can see everything I've captured so far

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-VOCAB-001

**Dependencies:**
* US-006, US-013

#### Acceptance Criteria

**AC-01**
* Given: I am authenticated and have saved vocabulary
* When: I open my vocabulary view
* Then: I see a list of my saved vocabulary

---

### US-020 — View Vocabulary Grouped by Item

**Epic:** EPIC-03

**As a:** learner

**I want to:** view my vocabulary grouped by word/phrase

**So that:** I can see all the ways I've encountered a given word

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-VOCAB-002

**Dependencies:**
* US-019, US-025

#### Acceptance Criteria

**AC-01**
* Given: I have saved multiple occurrences of the same vocabulary item
* When: I view my vocabulary grouped by item
* Then: All occurrences of that item appear grouped together under it

---

### US-021 — View an Individual Occurrence with Original Context

**Epic:** EPIC-03

**As a:** learner

**I want to:** open a specific saved vocabulary entry

**So that:** I can see the original sentence and situation it came from

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-VOCAB-003

**Dependencies:**
* US-019

#### Acceptance Criteria

**AC-01**
* Given: I have a saved vocabulary entry
* When: I open that specific entry
* Then: I see its original context alongside the meaning and example

---

### US-022 — Edit a Saved Vocabulary Entry

**Epic:** EPIC-03

**As a:** learner

**I want to:** edit a saved vocabulary entry

**So that:** I can correct or improve it if needed

**Priority:** P0

**Readiness:** Needs Product Decision

**Source Requirement(s):**
* FR-VOCAB-004

**Dependencies:**
* US-021

**Notes:**
`REQUIREMENTS.md` (AMB-01 / DEC-01) leaves open whether the original context text is itself editable, or only the meaning/notes layered on top of it. This directly affects the meaning of "context preservation" (FR-VOCAB-006, US-024). Acceptance Criteria cannot be finalized until this is decided. **Status: Blocked — Product Decision Required.**

---

### US-023 — Delete a Saved Vocabulary Entry

**Epic:** EPIC-03

**As a:** learner

**I want to:** delete a saved vocabulary entry

**So that:** I can remove vocabulary I no longer want to track

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-VOCAB-005

**Dependencies:**
* US-021

#### Acceptance Criteria

**AC-01**
* Given: I have a saved vocabulary entry
* When: I delete it
* Then: It is removed from my vocabulary, from future review sessions, and from future quizzes

---

### US-024 — Preserve Original Context

**Epic:** EPIC-03

**As a:** learner

**I want to:** trust that my saved context stays the same over time

**So that:** the sentence that helped me understand the word isn't silently changed

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-VOCAB-006

**Dependencies:**
* US-013

#### Acceptance Criteria

**AC-01**
* Given: I have a saved vocabulary entry
* When: I have not explicitly edited or deleted it
* Then: Its original context remains unchanged indefinitely

---

### US-025 — Distinguish Vocabulary Item, Meaning, and Occurrence

**Epic:** EPIC-03

**As a:** learner

**I want to:** see that the same word can have different meanings from different saved occurrences

**So that:** my vocabulary reflects how the word is actually used, not one flattened definition

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-VOCAB-007

**Dependencies:**
* US-013, US-021

#### Acceptance Criteria

**AC-01**
* Given: I have saved the same vocabulary item from two different occurrences with different meanings
* When: I view that item
* Then: Both meanings are visible as distinct, each tied to its own original occurrence, rather than collapsed into a single entry

---

### US-026 — Handle a Repeated Save of the Same Item or Occurrence

**Epic:** EPIC-03

**As a:** learner

**I want to:** have the system handle it sensibly if I save the same word or sentence more than once

**So that:** my vocabulary bank doesn't become confusing or cluttered with unintended duplicates

**Priority:** P0

**Readiness:** Needs Product Decision

**Source Requirement(s):**
* FR-VOCAB-007

**Dependencies:**
* US-013, US-025

**Notes:**
`REQUIREMENTS.md` (AMB-02 / DEC-02) leaves open whether a repeated save always creates a new entry or whether the system should detect and offer merging. Acceptance Criteria cannot be finalized until this is decided. **Status: Blocked — Product Decision Required.**

---

## EPIC-04 — Flashcard Review

### US-027 — Show Vocabulary Due for Review

**Epic:** EPIC-04

**As a:** learner

**I want to:** see which vocabulary is currently due for review

**So that:** I know what to review next

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-REVIEW-001
* EDGE-010

**Dependencies:**
* US-019

#### Acceptance Criteria

**AC-01**
* Given: I have vocabulary due for review
* When: I open the review screen
* Then: I see the due items presented for review

**AC-02**
* Given: I have no vocabulary currently due
* When: I open the review screen
* Then: I see a clear "nothing due right now" state rather than an empty or confusing screen

---

### US-028 — Display Item and Context During Review

**Epic:** EPIC-04

**As a:** learner

**I want to:** see the vocabulary item and its original context while reviewing

**So that:** I recall the word in the setting where I actually learned it

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-REVIEW-002

**Dependencies:**
* US-027

#### Acceptance Criteria

**AC-01**
* Given: I am reviewing a due item
* When: The flashcard is shown
* Then: Both the vocabulary item and its original context are visible

---

### US-029 — Reveal or Check the Meaning

**Epic:** EPIC-04

**As a:** learner

**I want to:** reveal or check the meaning of a flashcard

**So that:** I can verify whether I recalled it correctly

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-REVIEW-003

**Dependencies:**
* US-028

#### Acceptance Criteria

**AC-01**
* Given: I am viewing a flashcard
* When: I choose to reveal/check the meaning
* Then: The meaning associated with that item and occurrence is shown to me

---

### US-030 — Record Review Performance

**Epic:** EPIC-04

**As a:** learner

**I want to:** indicate how well I remembered a flashcard

**So that:** the system can use that information to schedule future reviews

**Priority:** P0

**Readiness:** Needs Product Decision

**Source Requirement(s):**
* FR-REVIEW-004

**Dependencies:**
* US-029

**Notes:**
`REQUIREMENTS.md` (AMB-04 / DEC-04) leaves open whether the performance signal is binary (remembered/forgotten) or a graded scale. This is a product-level decision, distinct from and prior to the scheduling algorithm choice (deferred to Architecture). Acceptance Criteria cannot specify what the user records or how without this decision. **Status: Blocked — Product Decision Required.**

---

### US-031 — Schedule Next Review Based on Performance

**Epic:** EPIC-04

**As a:** learner

**I want to:** have my next review date determined by how well I remembered an item

**So that:** I review what I'm forgetting more often than what I already know well

**Priority:** P0

**Readiness:** Deferred

**Source Requirement(s):**
* FR-REVIEW-005

**Dependencies:**
* US-030

**Notes:**
The specific scheduling algorithm is explicitly deferred to the Architecture/Technical Design phase (PRD §18, REQUIREMENTS.md DEC-09 carried-forward item). This story is also blocked upstream by US-030 (DEC-04), since scheduling cannot be specified without knowing the shape of the performance data it consumes. No algorithm or scheduling behavior is invented here. **Status: Deferred — Technical Design Required (and upstream Blocked — Product Decision Required via US-030).**

---

## EPIC-05 — Multiple-Choice Quiz

### US-032 — Generate a Multiple-Choice Quiz

**Epic:** EPIC-05

**As a:** learner

**I want to:** take a quiz generated from my saved vocabulary

**So that:** I can verify whether I actually retained what I've saved

**Priority:** P0

**Readiness:** Needs Product Decision

**Source Requirement(s):**
* FR-QUIZ-001
* REQ-AI-003

**Dependencies:**
* US-019

**Notes:**
`REQUIREMENTS.md` (AMB-07 / DEC-06) leaves open which vocabulary is eligible for a quiz (due-for-review items, all saved vocabulary, recent vocabulary, or a mix — Product Discovery's journey mentions "due/recent" but PRD does not restate a rule). Acceptance Criteria for quiz generation itself cannot be finalized until this eligibility rule is decided. **Status: Blocked — Product Decision Required.** (Downstream question-level behavior — US-033 through US-039 — is unaffected and Ready, since it applies once any quiz exists.)

---

### US-033 — Present Four Answer Options

**Epic:** EPIC-05

**As a:** learner

**I want to:** see exactly four answer options per quiz question

**So that:** the quiz format is consistent and predictable

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-QUIZ-002

**Dependencies:**
* US-032

#### Acceptance Criteria

**AC-01**
* Given: A quiz question is generated
* When: It is displayed to me
* Then: Exactly four answer options are shown

---

### US-034 — Select One Answer

**Epic:** EPIC-05

**As a:** learner

**I want to:** select one answer per question

**So that:** I can respond to the quiz

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-QUIZ-003

**Dependencies:**
* US-033

#### Acceptance Criteria

**AC-01**
* Given: A question with four options is displayed
* When: I choose one option
* Then: My selection is registered for evaluation

---

### US-035 — Evaluate the Selected Answer

**Epic:** EPIC-05

**As a:** learner

**I want to:** have my answer evaluated

**So that:** I know whether I got it right

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-QUIZ-004

**Dependencies:**
* US-034

#### Acceptance Criteria

**AC-01**
* Given: I have selected an answer
* When: The system evaluates it
* Then: It is deterministically marked correct or incorrect based on the known correct option

---

### US-036 — Show the Result

**Epic:** EPIC-05

**As a:** learner

**I want to:** see whether my answer was correct or incorrect immediately

**So that:** I get immediate feedback on my recall

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-QUIZ-005

**Dependencies:**
* US-035

#### Acceptance Criteria

**AC-01**
* Given: My answer has been evaluated
* When: The evaluation completes
* Then: I immediately see whether I was correct or incorrect

---

### US-037 — Show an Explanation

**Epic:** EPIC-05

**As a:** learner

**I want to:** see an explanation of the correct answer

**So that:** I understand why my answer was right or wrong

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-QUIZ-006

**Dependencies:**
* US-035

#### Acceptance Criteria

**AC-01**
* Given: My answer has been evaluated
* When: The result is shown
* Then: An explanation of the correct answer is also shown

---

### US-038 — Record the Quiz Result

**Epic:** EPIC-05

**As a:** learner

**I want to:** have each of my quiz answers recorded

**So that:** my performance is available for statistics and history

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-QUIZ-007

**Dependencies:**
* US-035

#### Acceptance Criteria

**AC-01**
* Given: I have answered a quiz question
* When: It is evaluated
* Then: The result is stored and available to downstream statistics

---

### US-039 — Update Learning Statistics from Quiz Results

**Epic:** EPIC-05

**As a:** learner

**I want to:** have my statistics update after I complete quiz questions

**So that:** my dashboard reflects my most recent activity

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-QUIZ-008

**Dependencies:**
* US-038

#### Acceptance Criteria

**AC-01**
* Given: A quiz result has been recorded
* When: My statistics are recalculated
* Then: My dashboard reflects the updated statistics (see US-042)

---

## EPIC-06 — Dashboard

### US-040 — Show Due-for-Review Count

**Epic:** EPIC-06

**As a:** learner

**I want to:** see how much vocabulary is currently due for review

**So that:** I know how much review work is waiting for me

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-DASH-001

**Dependencies:**
* US-027

#### Acceptance Criteria

**AC-01**
* Given: I have vocabulary due for review
* When: I open the dashboard
* Then: I see the count of items currently due

---

### US-041 — Show Recent Learning Activity

**Epic:** EPIC-06

**As a:** learner

**I want to:** see my recent learning activity

**So that:** I can quickly recall what I've been doing recently

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-DASH-002

**Dependencies:**
* US-019, US-030, US-038

#### Acceptance Criteria

**AC-01**
* Given: I have recently saved, reviewed, or quizzed on vocabulary
* When: I open the dashboard
* Then: I see a summary of that recent activity

---

### US-042 — Show Basic Learning Statistics

**Epic:** EPIC-06

**As a:** learner

**I want to:** see basic statistics about my learning

**So that:** I stay motivated by seeing tangible progress

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-DASH-003

**Dependencies:**
* US-019, US-030

#### Acceptance Criteria

**AC-01**
* Given: I have saved and/or reviewed vocabulary
* When: I open the dashboard
* Then: I see basic totals (e.g., total saved, total reviewed)

---

### US-043 — Show Recent Quiz Results

**Epic:** EPIC-06

**As a:** learner

**I want to:** see my recent quiz results

**So that:** I can track how I'm doing on tests of my recall

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-DASH-004

**Dependencies:**
* US-038

#### Acceptance Criteria

**AC-01**
* Given: I have completed at least one quiz
* When: I open the dashboard
* Then: I see my recent quiz results

---

### US-044 — Show Progress Over Time

**Epic:** EPIC-06

**As a:** learner

**I want to:** see some indication of my progress over time

**So that:** I understand whether my learning is trending in the right direction

**Priority:** P0

**Readiness:** Needs Product Decision

**Source Requirement(s):**
* FR-DASH-005

**Dependencies:**
* US-042

**Notes:**
`REQUIREMENTS.md` §6 (decomposed as REQ-DASH-05b) and §17 both flag this requirement as vague — which metric(s), what time range, and what visual form "progress over time" should take are all undefined. **This item does not have a formal DEC-ID in `REQUIREMENTS.md`'s Decision Log (DEC-01–DEC-08)**, which appears to be a gap in that document rather than an intentional omission; it is recorded here as an unresolved product decision, without requiring or inventing a new decision ID in this document. **Status: Blocked — Product Decision Required. The missing decision is recorded here as a gap; no new DEC-ID is invented.**

---

## EPIC-07 — Settings

### US-045 — View and Update Basic Settings

**Epic:** EPIC-07

**As a:** learner

**I want to:** view and update basic settings relevant to my learning

**So that:** I can adjust the product to my preferences

**Priority:** P0

**Readiness:** Needs Product Decision

**Source Requirement(s):**
* FR-SETTINGS-001
* FR-SETTINGS-002

**Dependencies:**
* US-002

**Notes:**
`REQUIREMENTS.md` (AMB-09 / DEC-08 / MISSING-01) confirms that no specific MVP settings are enumerated anywhere in `PRODUCT-DISCOVERY.md` or `PRD.md`. Acceptance Criteria cannot be written because there is currently no defined set of settings to test against. **Status: Blocked — Product Decision Required.** FR-SETTINGS-002 ("no complex customization") is a scope constraint on whatever settings are eventually enumerated, not an independent user-facing behavior, and is represented here as a constraint on this story rather than as its own story.

---

## EPIC-08 — Privacy & Data Handling

### US-046 — Only Selected Text Initiates Capture

**Epic:** EPIC-08

**As a:** learner

**I want to:** know that capture only ever starts from something I explicitly selected

**So that:** I'm never surprised by vocabulary being captured without my action

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-PRIV-001

**Dependencies:**
* US-007

#### Acceptance Criteria

**AC-01**
* Given: I have not made a text selection
* When: I am browsing a webpage with the Extension active
* Then: No vocabulary capture is initiated

---

### US-047 — Only Minimum Necessary Context Is Captured

**Epic:** EPIC-08

**As a:** learner

**I want to:** know that only the minimum context needed is captured alongside my selection

**So that:** unrelated content from the page is never collected

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-PRIV-002

**Dependencies:**
* US-009

#### Acceptance Criteria

**AC-01**
* Given: I have selected text
* When: Context is captured alongside it
* Then: Only the minimum context necessary to interpret that selection is included

---

### US-048 — No Passive Whole-Page Scanning

**Epic:** EPIC-08

**As a:** learner

**I want to:** know the Extension never scans an entire webpage

**So that:** my general browsing content is never monitored

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-PRIV-003

**Dependencies:**
* US-018

#### Acceptance Criteria

**AC-01**
* Given: The Extension is active on any webpage
* When: I am not making a selection
* Then: No page-wide scanning occurs at any point

---

### US-049 — No Whole-Page Transmission to AI

**Epic:** EPIC-08

**As a:** learner

**I want to:** know that entire webpages are never sent to the AI service

**So that:** my browsing content stays private by default

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-PRIV-004

**Dependencies:**
* US-010

#### Acceptance Criteria

**AC-01**
* Given: An AI request is made for a selected occurrence
* When: Data is transmitted
* Then: Only the selection and its minimum necessary context are sent — never the full webpage — by default

---

### US-050 — User Can Understand What Content Is Being Processed

**Epic:** EPIC-08

**As a:** learner

**I want to:** understand, at a basic level, what content is being processed when I use the Extension

**So that:** I can trust the product with my data

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-PRIV-005

**Dependencies:**
* US-046, US-047

#### Acceptance Criteria

**AC-01**
* Given: I am using the Extension's capture flow
* When: I want to know what is being processed
* Then: I can determine, at a product level, that only my selection and minimal surrounding context are being sent

**Notes:**
The exact mechanism for conveying this (e.g., inline notice, settings page, help documentation) is not specified in the source documents and is left open for a later design decision; the requirement itself — that this understanding must be possible — is Ready.

---

### US-051 — Data Retention Policy Is Communicated as Pending

**Epic:** EPIC-08

**As a:** learner

**I want to:** know that the product's data retention policy is not yet finalized

**So that:** I am not misled about how long my data is kept before that policy is set

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* FR-PRIV-006

**Dependencies:**
* None

#### Acceptance Criteria

**AC-01**
* Given: Data retention specifics have not yet been finalized by the product owner
* When: The product states its privacy posture
* Then: It does not claim a specific retention period that has not actually been decided

**Notes:**
The actual retention duration/policy itself remains a deferred business/legal decision (PRD §18) and is not specified here. This story only requires that the product does not silently invent or misrepresent a retention policy that hasn't been set.

---

## EPIC-09 — AI Capabilities

### US-052 — Generate Context-Aware Meaning

**Epic:** EPIC-09

**As a:** product capability (invoked by the Extension)

**I want to:** analyze a selected occurrence and return a meaning specific to that context

**So that:** the learner gets an explanation of real usage rather than a generic definition

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* REQ-AI-001

**Dependencies:**
* US-010

#### Acceptance Criteria

**AC-01**
* Given: A selection and its minimum context are received
* When: Analysis is requested
* Then: A meaning specific to that occurrence is returned, not a generic isolated-word definition

**Notes:**
No AI provider, model, or infrastructure is specified here — this is a product-level capability requirement only, consistent with PRD §10's constraint against provider lock-in.

---

### US-053 — Generate an Example for a Selected Occurrence

**Epic:** EPIC-09

**As a:** product capability (invoked by the Extension)

**I want to:** generate an example related to a selected occurrence

**So that:** the learner has a second reference point for usage

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* REQ-AI-002

**Dependencies:**
* US-010

#### Acceptance Criteria

**AC-01**
* Given: A selection and its minimum context are received
* When: Example generation is requested
* Then: An example related to that specific occurrence is returned

---

### US-054 — Generate Multiple-Choice Quiz Questions

**Epic:** EPIC-09

**As a:** product capability (invoked by the Web App)

**I want to:** generate multiple-choice questions from saved vocabulary

**So that:** the learner can be quizzed on their own saved vocabulary

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* REQ-AI-003

**Dependencies:**
* US-032 (for eligible vocabulary — noting US-032 itself is blocked; question *generation mechanics* are ready once eligible vocabulary is supplied)

#### Acceptance Criteria

**AC-01**
* Given: A set of eligible vocabulary is supplied
* When: Question generation is requested
* Then: A multiple-choice question with four options is returned, matching FR-QUIZ-001/002

**Notes:**
This story covers the generation *mechanism* only; which vocabulary is eligible to be supplied is governed by US-032, which is currently blocked (DEC-06).

---

## EPIC-10 — Error & Edge Cases

The following EDGE-* requirements from `REQUIREMENTS.md` are intentionally represented as Acceptance Criteria within other stories rather than as standalone stories here, per Section 19 of the task instructions:

- **EDGE-001** (no text selected) → AC-02 of US-010
- **EDGE-004** (AI request fails) → US-016 (dedicated story)
- **EDGE-006** (save fails) → US-017 (dedicated story)
- **EDGE-007** (unauthenticated action) → AC-01 of US-006
- **EDGE-010** (no vocabulary due) → AC-02 of US-027

The remaining EDGE-* requirements are cross-cutting or otherwise warrant a dedicated story below.

### US-055 — Prevent Unusable AI Content from Being Saved or Shown as Valid

**Epic:** EPIC-10

**As a:** learner

**I want to:** be protected from malformed or unusable AI output being presented or saved as if it were a valid explanation

**So that:** I never build vocabulary around a broken or nonsensical explanation

**Priority:** P0

**Readiness:** Deferred

**Source Requirement(s):**
* EDGE-005

**Dependencies:**
* US-011, US-012, US-013

**Notes:**
`REQUIREMENTS.md` (Section 13) confirms this behavior is defined in principle ("must not be saved or shown as valid") but the detection rule for what counts as "unusable" is not specified and is deferred as a technical concern. No detection mechanism is invented here. **Status: Deferred — Technical Design Required.**

---

### US-056 — Handle Insufficient or Ambiguous Selection/Context

**Epic:** EPIC-10

**As a:** learner

**I want to:** be told when my selection or its context is too short or ambiguous to interpret

**So that:** I understand why I'm not getting a useful explanation and can try a different selection

**Priority:** P0

**Readiness:** Needs Product Decision

**Source Requirement(s):**
* EDGE-002
* EDGE-003

**Dependencies:**
* US-010, US-011

**Notes:**
`REQUIREMENTS.md` (AMB-05 / DEC-05) confirms there is no stated rule for when a selection is "too short," "ambiguous," or when context is "insufficient." Acceptance Criteria cannot specify a trigger condition without this decision. **Status: Blocked — Product Decision Required.**

---

### US-057 — Handle Network Failure During Core Actions

**Epic:** EPIC-10

**As a:** learner

**I want to:** be clearly informed if my network connection fails during capture, save, review, or quiz actions

**So that:** I understand the action didn't complete and isn't silently lost

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* EDGE-008

**Dependencies:**
* US-010, US-013, US-027, US-032

#### Acceptance Criteria

**AC-01**
* Given: My network connection fails during a capture, save, review, or quiz action
* When: The failure occurs
* Then: I see a clear indication that the action failed due to a connectivity issue

**Notes:**
Multi-device synchronization behavior beyond a single action's failure is flagged in `REQUIREMENTS.md` as Optional/Future (not blocking MVP readiness) and is not addressed here.

---

### US-058 — Handle Quiz Generation Failure Due to Insufficient Vocabulary

**Epic:** EPIC-10

**As a:** learner

**I want to:** be informed if there isn't enough vocabulary to generate a meaningful quiz

**So that:** I don't encounter a broken or empty quiz

**Priority:** P0

**Readiness:** Needs Product Decision

**Source Requirement(s):**
* EDGE-009

**Dependencies:**
* US-032

**Notes:**
`REQUIREMENTS.md` (AMB-06 / DEC-05) confirms there is no defined minimum vocabulary threshold for a valid quiz, and this is further compounded by US-032's own blocked eligibility rule (DEC-06). Acceptance Criteria cannot be finalized until both are resolved. **Status: Blocked — Product Decision Required.**

---

### US-059 — Guide a New User with No Saved Vocabulary

**Epic:** EPIC-10

**As a:** new learner

**I want to:** be guided toward the capture flow when I have no saved vocabulary yet

**So that:** I understand what to do first instead of seeing a confusing empty screen

**Priority:** P0

**Readiness:** Ready

**Source Requirement(s):**
* EDGE-011

**Dependencies:**
* US-019, US-040

#### Acceptance Criteria

**AC-01**
* Given: I am a new user with no saved vocabulary
* When: I open the dashboard or vocabulary view
* Then: I am guided toward the Extension capture flow rather than shown an empty, unexplained screen

---

## 18. Dependencies (Consolidated)

Product-level dependency chains, expressed at the story level (no technical/database/API dependencies):

```
Authentication (US-001–US-006)
   └─→ Extension Save (US-013)
         └─→ Vocabulary Management (US-019–US-026)
               └─→ Flashcard Review (US-027–US-031)
                     └─→ Review Performance (US-030)
                           └─→ Next-Review Scheduling (US-031)
               └─→ Quiz Content Pool (US-032, via US-054)
                     └─→ Quiz Results (US-038)
                           └─→ Dashboard Statistics (US-039, US-042)
         └─→ Dashboard (US-040–US-044)

Extension Capture (US-007–US-009)
   └─→ AI Meaning / Example (US-052, US-053, via US-010–US-012)
         └─→ Save with Context (US-013)

Privacy Boundary (US-046–US-051)
   └─→ Enforced throughout Extension Capture (US-007–US-012, US-018) — not a downstream consumer, but a constraint applied at every capture step
```

No database tables, API endpoints, services, or technical modules are described — these dependencies are product-level only, consistent with `REQUIREMENTS.md` Section 9.

## 19. Requirement Traceability Matrix

| Requirement | User Story | Epic | Priority | Readiness |
|---|---|---|---|---|
| FR-AUTH-001 | US-001 | EPIC-01 | P0 | Ready |
| FR-AUTH-002 | US-002 | EPIC-01 | P0 | Ready |
| FR-AUTH-003 | US-003 | EPIC-01 | P0 | Ready |
| FR-AUTH-004 | US-004 | EPIC-01 | P0 | Ready |
| FR-AUTH-005 | US-005 | EPIC-01 | P0 | Needs Product Decision |
| FR-AUTH-006 | US-006 | EPIC-01 | P0 | Ready |
| FR-EXT-001 | US-007 | EPIC-02 | P0 | Ready |
| FR-EXT-002 | US-008 | EPIC-02 | P0 | Ready |
| FR-EXT-003 | US-009 | EPIC-02 | P0 | Ready |
| FR-EXT-004 | US-010 | EPIC-02 | P0 | Ready |
| FR-EXT-005 | US-011 | EPIC-02 | P0 | Ready |
| FR-EXT-006 | US-012 | EPIC-02 | P0 | Ready |
| FR-EXT-007 | US-013 | EPIC-02 | P0 | Ready |
| FR-EXT-008 | US-014 | EPIC-02 | P0 | Needs Product Decision |
| FR-EXT-009 | US-015 | EPIC-02 | P0 | Ready |
| FR-EXT-010 | US-016 | EPIC-02 | P0 | Ready |
| FR-EXT-011 | US-017 | EPIC-02 | P0 | Ready |
| FR-EXT-012 | US-018 | EPIC-02 | P0 | Ready |
| FR-VOCAB-001 | US-019 | EPIC-03 | P0 | Ready |
| FR-VOCAB-002 | US-020 | EPIC-03 | P0 | Ready |
| FR-VOCAB-003 | US-021 | EPIC-03 | P0 | Ready |
| FR-VOCAB-004 | US-022 | EPIC-03 | P0 | Needs Product Decision |
| FR-VOCAB-005 | US-023 | EPIC-03 | P0 | Ready |
| FR-VOCAB-006 | US-024 | EPIC-03 | P0 | Ready |
| FR-VOCAB-007 | US-025, US-026 | EPIC-03 | P0 | Ready (US-025) / Needs Product Decision (US-026) |
| FR-REVIEW-001 | US-027 | EPIC-04 | P0 | Ready |
| FR-REVIEW-002 | US-028 | EPIC-04 | P0 | Ready |
| FR-REVIEW-003 | US-029 | EPIC-04 | P0 | Ready |
| FR-REVIEW-004 | US-030 | EPIC-04 | P0 | Needs Product Decision |
| FR-REVIEW-005 | US-031 | EPIC-04 | P0 | Deferred |
| FR-QUIZ-001 | US-032 | EPIC-05 | P0 | Needs Product Decision |
| FR-QUIZ-002 | US-033 | EPIC-05 | P0 | Ready |
| FR-QUIZ-003 | US-034 | EPIC-05 | P0 | Ready |
| FR-QUIZ-004 | US-035 | EPIC-05 | P0 | Ready |
| FR-QUIZ-005 | US-036 | EPIC-05 | P0 | Ready |
| FR-QUIZ-006 | US-037 | EPIC-05 | P0 | Ready |
| FR-QUIZ-007 | US-038 | EPIC-05 | P0 | Ready |
| FR-QUIZ-008 | US-039 | EPIC-05 | P0 | Ready |
| FR-DASH-001 | US-040 | EPIC-06 | P0 | Ready |
| FR-DASH-002 | US-041 | EPIC-06 | P0 | Ready |
| FR-DASH-003 | US-042 | EPIC-06 | P0 | Ready |
| FR-DASH-004 | US-043 | EPIC-06 | P0 | Ready |
| FR-DASH-005 | US-044 | EPIC-06 | P0 | Needs Product Decision (unlogged in DEC-*) |
| FR-SETTINGS-001 | US-045 | EPIC-07 | P0 | Needs Product Decision |
| FR-SETTINGS-002 | US-045 (represented as a constraint, not a separate story) | EPIC-07 | P0 | Needs Product Decision |
| FR-PRIV-001 | US-046 | EPIC-08 | P0 | Ready |
| FR-PRIV-002 | US-047 | EPIC-08 | P0 | Ready |
| FR-PRIV-003 | US-048 | EPIC-08 | P0 | Ready |
| FR-PRIV-004 | US-049 | EPIC-08 | P0 | Ready |
| FR-PRIV-005 | US-050 | EPIC-08 | P0 | Ready |
| FR-PRIV-006 | US-051 | EPIC-08 | P0 | Ready |
| REQ-AI-001 | US-052 | EPIC-09 | P0 | Ready |
| REQ-AI-002 | US-053 | EPIC-09 | P0 | Ready |
| REQ-AI-003 | US-054 | EPIC-09 | P0 | Ready |
| EDGE-001 | Represented as AC-02 of US-010 | EPIC-02 | P0 | Ready |
| EDGE-002 | US-056 | EPIC-10 | P0 | Needs Product Decision |
| EDGE-003 | US-056 | EPIC-10 | P0 | Needs Product Decision |
| EDGE-004 | US-016 | EPIC-02 | P0 | Ready |
| EDGE-005 | US-055 | EPIC-10 | P0 | Deferred |
| EDGE-006 | US-017 | EPIC-02 | P0 | Ready |
| EDGE-007 | Represented as AC-01 of US-006 | EPIC-01 | P0 | Ready |
| EDGE-008 | US-057 | EPIC-10 | P0 | Ready |
| EDGE-009 | US-058 | EPIC-10 | P0 | Needs Product Decision |
| EDGE-010 | Represented as AC-02 of US-027 | EPIC-04 | P0 | Ready |
| EDGE-011 | US-059 | EPIC-10 | P0 | Ready |

Every functional, AI, privacy, and edge-case requirement in `REQUIREMENTS.md` is represented above. No requirement was silently dropped.

## 20. MVP Story Summary

| Epic | Ready Stories | Needs Clarification | Needs Product Decision | Deferred |
|---|---:|---:|---:|---:|
| EPIC-01 Authentication | 5 | 0 | 1 | 0 |
| EPIC-02 Extension — Contextual Capture | 11 | 0 | 1 | 0 |
| EPIC-03 Vocabulary Management | 6 | 0 | 2 | 0 |
| EPIC-04 Flashcard Review | 3 | 0 | 1 | 1 |
| EPIC-05 Multiple-Choice Quiz | 7 | 0 | 1 | 0 |
| EPIC-06 Dashboard | 4 | 0 | 1 | 0 |
| EPIC-07 Settings | 0 | 0 | 1 | 0 |
| EPIC-08 Privacy & Data Handling | 6 | 0 | 0 | 0 |
| EPIC-09 AI Capabilities | 3 | 0 | 0 | 0 |
| EPIC-10 Error & Edge Cases | 2 | 0 | 2 | 1 |
| **Total** | **47** | **0** | **10** | **2** |

- **Total User Stories:** 59 (US-001–US-059)
- **Total P0 stories:** 59
- **Total P1 stories:** 0
- **Total P2 stories:** 0
- **Total Ready:** 47
- **Total blocked by Product Decision:** 10
- **Total requiring Clarification:** 0 (all previously ambiguous items were aligned to a logged Decision Log entry — see Section 1.1 — and are therefore counted under Needs Product Decision rather than Needs Clarification)
- **Total Deferred:** 2

Counts above were tallied directly from the User Story list in Sections EPIC-01 through EPIC-10; none were estimated.

## 21. Product Decisions Blocking Implementation

| Decision | Affected Requirement(s) | Affected User Story(ies) | Why It Blocks / Limits Acceptance Criteria |
|---|---|---|---|
| DEC-01 — Is original context user-editable, or only the meaning/notes? | FR-VOCAB-004 | US-022 | Cannot define what "edit" means or write testable AC without knowing which fields are editable |
| DEC-02 — Does a repeated save always create a new entry, or offer merging? | FR-VOCAB-007 | US-026 | Cannot define expected system behavior for a duplicate/repeat save without this choice |
| DEC-03 — What specific account-management actions are in MVP? | FR-AUTH-005 | US-005 | No action set exists to write AC against |
| DEC-04 — Is review performance binary or graded? | FR-REVIEW-004 | US-030 | Cannot define what the learner records; also blocks US-031 (scheduling) downstream |
| DEC-05 — What qualifies as "too short/ambiguous" input or "insufficient" vocabulary for a quiz? | EDGE-002, EDGE-003, EDGE-009 | US-056, US-058 | No trigger condition exists to test against |
| DEC-06 — Which vocabulary is eligible for a quiz (due, recent, all, or a mix)? | FR-QUIZ-001 | US-032 | Cannot define the input pool for quiz generation; also compounds US-058 |
| DEC-07 — Does the Extension's "open in Web App" link go to a general view or a specific item? | FR-EXT-008 | US-014 | Cannot define the expected destination |
| DEC-08 — What are the actual MVP settings? | FR-SETTINGS-001, FR-SETTINGS-002 | US-045 | No settings exist to write AC against |
| *(Unlogged)* — What metric(s)/time range should "progress over time" show? | FR-DASH-005 | US-044 | No formal DEC-ID currently exists in `REQUIREMENTS.md` for this gap; flagged here for the document owner to add one |

DEC-09 (carried forward: AI provider/model, SRS algorithm, data model, website scope, authentication method, monetization, data retention specifics) is not re-litigated here — it remains deferred to Architecture/Database/API/Business phases exactly as `REQUIREMENTS.md` already states, and is referenced in US-031's Notes as the reason that story is Deferred rather than simply blocked.

No decision above was made by this document. All are left for the product owner.

## 22. User Story Quality Check

Every story in this document was checked against:

- **User value clear:** Yes — every story states a concrete "so that" outcome tied to an approved Goal (G1–G5) or JTBD.
- **Actor clear:** Yes — Learner, Extension, Web App, or AI capability, matching Section 4 of `REQUIREMENTS.md`.
- **Goal and outcome clear:** Yes, including for blocked/deferred stories (the goal is stated even where AC cannot yet be written).
- **Requirement traceable:** Yes — see Section 19.
- **Priority consistent:** Yes — all P0, per the Section 1.1 correction, with no invented Should/Could-Have stories.
- **Readiness consistent:** Yes — aligned to `REQUIREMENTS.md` Sections 14/19 (Decision Log-backed items = Needs Product Decision; algorithm/technical-only items = Deferred).
- **Acceptance Criteria testable:** Yes for all 47 Ready stories; blocked/deferred stories explicitly state why AC cannot yet be written rather than presenting invented criteria.
- **No technical implementation details:** Confirmed — no database, API, algorithm, or infrastructure detail appears in any story or AC.
- **No invented scope:** Confirmed — every story traces to an existing FR-*, REQ-AI-*, or EDGE-* ID; no Should/Could-Have feature was converted into a story.
- **No unresolved product decision silently assumed:** Confirmed — every AMB-*/DEC-* item identified in `REQUIREMENTS.md` is reflected as a blocked or deferred story rather than resolved here.

## 23. Final Consistency Check

1. **No approved requirement is missing** — confirmed via the Traceability Matrix (Section 19), which covers every FR-*, REQ-AI-*, and EDGE-* ID from `REQUIREMENTS.md`.
2. **No out-of-scope feature was introduced** — confirmed; no PRD §4 Non-Goal, and no un-IDed Should/Could-Have item, was converted into a story.
3. **No product decision was silently made** — confirmed; all AMB-*/DEC-* items are reflected as Needs Product Decision or Deferred stories, with the specific blocking question stated in each story's Notes.
4. **No P0/P1/P2 inconsistency exists** — resolved by explicitly adopting `REQUIREMENTS.md` Section 10.2 (the corrected model) as documented in Section 1.1 above; this inconsistency in the source document is reported, not silently papered over.
5. **Priority and Readiness are separated** — confirmed throughout; e.g., US-045 is Priority: P0, Readiness: Needs Product Decision.
6. **Every User Story has a stable ID** — confirmed, US-001 through US-059, contiguous and non-repeating.
7. **Every story has traceability** — confirmed via each story's "Source Requirement(s)" field and Section 19.
8. **Ready stories have testable Acceptance Criteria** — confirmed for all 47 Ready stories.
9. **Blocked stories clearly state why they are blocked** — confirmed via each blocked/deferred story's Notes field, referencing the specific AMB-*/DEC-* item.
10. **Story counts exactly match the final tables** — confirmed: Section 20's table sums to 59 (47 Ready + 10 Needs Product Decision + 2 Deferred + 0 Needs Clarification), matching the 59 stories actually written.
