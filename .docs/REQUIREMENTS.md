# Requirement Analysis — LinguaFlow

## 1. Document Overview

- **Purpose:** This document performs a structured requirement analysis of LinguaFlow, transforming the approved Product Discovery and PRD into a clearer, decomposed, quality-checked, and traceable requirement specification, in preparation for the next phase (User Stories & Acceptance Criteria).
- **Status:** Reviewed and corrected. This document does not itself approve or change any product decision — it analyzes what has already been approved.
- **Scope:** Requirement analysis only. No technical architecture, database schema, API design, or code is defined here.
- **What this document does NOT do:** It does not introduce new product scope. Anything that looks necessary but is not currently specified is placed under Open Questions / Future Decisions (Section 16) or flagged as an ambiguity (Section 14), never silently added as a requirement.

## 2. Source Documents

- `docs/PRODUCT-DISCOVERY.md` (Revised, Approved) — source of truth for product direction, target users, vision, boundaries, and hypotheses.
- `docs/PRD.md` — source of truth for functional/product-level requirements (FR-*, EDGE-*), derived from Product Discovery.

Where PRD and Product Discovery differ only in wording but agree in substance, PRD requirement IDs are treated as canonical for traceability, and Product Discovery is cited as the originating rationale.

## 3. Requirement Analysis Objectives

- Inventory all meaningful requirements from the PRD and categorize them.
- Decompose broad or multi-part requirements into atomic, testable units where necessary.
- Assess requirement quality (clarity, atomicity, consistency, testability, feasibility, traceability, completeness).
- Define actors and system boundaries.
- Map dependencies between requirement domains.
- Normalize priorities (P0/P1/P2) against the PRD's Must/Should/Could/Out-of-Scope.
- Extract non-functional requirements that are explicitly supported by the source documents, without inventing numeric targets.
- Analyze privacy/data handling, edge cases, ambiguities, and conflicts.
- Identify missing requirements without adding them to MVP scope.
- Assess readiness for User Stories & Acceptance Criteria.
- Produce a traceability matrix and a decision log for anything unresolved.

## 4. Actors and System Boundaries

| Actor | Role |
|---|---|
| **Learner / User** | A B1–B2 university student or young adult learner. Reads English content, selects unfamiliar text, saves vocabulary, reviews flashcards, takes quizzes, views progress. Initiates every capture and every review/quiz action — the system never acts on their behalf without an explicit action. |
| **Chrome Extension** | Responsible only for: detecting a user's text selection, capturing that selection plus the minimum necessary surrounding context, requesting an AI explanation/example for that specific occurrence, showing the popup, and saving the result (with context) to the user's account. It has no responsibility for review scheduling, quizzing, or statistics. |
| **Web Application** | Responsible for everything downstream of capture: authentication, vocabulary management (view/edit/delete, item/meaning/occurrence-aware), flashcard review, performance-based scheduling, multiple-choice quizzing, dashboard, and settings. It has no responsibility for in-page text selection. |
| **AI capability (product-level)** | A capability the Web App and Extension call into for three things only: context-aware meaning/explanation, example generation, and multiple-choice quiz question generation. It is not modeled here as a specific provider, model, or infrastructure — only as a product-level capability boundary. |

**Explicitly outside the MVP boundary (per Non-Goals, PRD §4):** video/subtitle-based learning, dictation, shadowing, speaking/pronunciation, AI conversation, personalized learning paths, PDF/article/passage learning and summarization, non-multiple-choice quiz types, general-purpose translation, full AI tutoring, and any passive/whole-page scanning by the Extension.

**Boundary note:** The AI capability never acts as an independent actor with autonomous access to user data — it is only ever invoked with the specific inputs the Extension or Web App explicitly send it (selected text + minimum context, or vocabulary due for quizzing).

## 5. Requirement Inventory

Requirements are grouped by category. Original PRD IDs are preserved; no duplicates are created here.

**Functional Requirements**
- Authentication: FR-AUTH-001 – FR-AUTH-006
- Extension / Contextual Capture: FR-EXT-001 – FR-EXT-012
- Vocabulary Management: FR-VOCAB-001 – FR-VOCAB-007
- Flashcard Review: FR-REVIEW-001 – FR-REVIEW-005
- Multiple-Choice Quiz: FR-QUIZ-001 – FR-QUIZ-008
- Dashboard: FR-DASH-001 – FR-DASH-005
- Settings: FR-SETTINGS-001 – FR-SETTINGS-002

**AI Requirements** (stated in PRD §10 as prose, not individually IDed — decomposed here for traceability)
- REQ-AI-001: Provide context-aware meaning/explanation for a selected occurrence (source: PRD §10, supports FR-EXT-005).
- REQ-AI-002: Generate an example related to a selected occurrence (source: PRD §10, supports FR-EXT-006).
- REQ-AI-003: Generate multiple-choice quiz questions from saved vocabulary (source: PRD §10, supports FR-QUIZ-001).

**Privacy & Security Requirements**
- FR-PRIV-001 – FR-PRIV-006

**Non-Functional Requirements** — not individually IDed in the PRD; extracted and given REQ-NFR-* IDs in Section 11.

**UX / Usability Requirements** — implicit across FR-EXT-009/010/011, EDGE-001–011, and FR-DASH; consolidated in Section 11.

**Business / Success Requirements**
- Goals G1–G5 (PRD §3)
- Success metrics (PRD §13)
- Product Hypotheses 1–4 (PRD §14)

**Error / Edge Case Requirements**
- EDGE-001 – EDGE-011

## 6. Requirement Decomposition

Most PRD requirements are already reasonably atomic. The following are broad, vague, or multi-part enough to warrant decomposition before User Stories. Original IDs are preserved as the source; new REQ-IDs are proposed only where genuinely needed.

| Original | Issue | Proposed Decomposition |
|---|---|---|
| **FR-AUTH-005** ("basic account management") | Too vague — "basic account management" does not state which account actions are in scope. | REQ-AUTH-05a: View own account details. REQ-AUTH-05b: Update account details (scope of "details" — needs product decision, see Ambiguity AMB-03). |
| **FR-VOCAB-004** ("edit a saved vocabulary entry") | Too broad — does not specify which fields are editable (the captured meaning/example? the original context text? both?). | REQ-VOCAB-04a: Edit the saved meaning/explanation text. REQ-VOCAB-04b: Edit or annotate the original context (interacts with FR-VOCAB-006's context-preservation intent — see Ambiguity AMB-01). |
| **FR-EXT-008** ("provide a way to open ... in the Web application") | Vague mechanism — could mean a generic "go to LinguaFlow" link or a deep link to that specific vocabulary entry. | REQ-EXT-08a: Provide a link/action from the Extension to the Web application. REQ-EXT-08b: (Needs Product Decision) Whether that link targets the specific saved item or only the general vocabulary view. |
| **FR-DASH-005** ("progress over time ... to the extent supported by approved scope") | Self-admittedly vague in the PRD itself; "simple trend" is undefined. | REQ-DASH-05a: Show some visual or numeric indicator of activity over time. REQ-DASH-05b: (Needs Product Decision) Which trend(s) — saves, reviews, or quiz accuracy — and over what period. |
| **FR-SETTINGS-001** ("basic account/learning settings relevant to MVP") | No settings are actually enumerated anywhere in Product Discovery or PRD. | REQ-SETTINGS-01: (Needs Product Decision) Enumerate the specific MVP settings before this can be made testable. Not decomposed further here — see Missing Requirements (Section 13). |
| **FR-REVIEW-004** ("record ... performance (e.g., whether the item was remembered)") | Ambiguous granularity — binary remembered/forgotten vs. a graded scale is left open, yet FR-REVIEW-005 depends on this data to schedule reviews. | REQ-REVIEW-04a: Record a performance signal per review. REQ-REVIEW-04b: (Needs Product Decision) Define whether the signal is binary or graded (deferred, since it borders the scheduling algorithm — Architecture phase per PRD §18 — but the *shape* of the input is a product-level decision that should be resolved before User Stories). |

All other FR-* requirements were assessed as sufficiently atomic for User Story conversion (see Section 17).

## 7. Requirement Quality Assessment

Assessed against Clarity, Atomicity, Consistency, Testability, Feasibility, Traceability, Completeness. Only requirements with a notable issue are listed; everything not listed here was assessed as acceptable on all seven criteria.

| Requirement | Clarity | Atomicity | Testability | Completeness | Note |
|---|---|---|---|---|---|
| FR-AUTH-005 | Low | OK | Low | Low | "Basic account management" has no defined action set — cannot write a pass/fail test as written. |
| FR-VOCAB-004 | Medium | Low | Medium | Low | Bundles "edit" without specifying which fields; interacts with FR-VOCAB-006. |
| FR-VOCAB-007 | Medium | OK | Medium | Medium | Correctly product-level, but doesn't state what happens when a user saves the *same* occurrence twice, or a *new* occurrence of an item they've already saved (see AMB-01, AMB-02). |
| FR-EXT-008 | Medium | OK | Medium | Low | Doesn't specify destination granularity (specific item vs. general view). |
| FR-REVIEW-004 | Medium | OK | Low | Medium | Performance signal shape undefined; FR-REVIEW-005 cannot be objectively tested until this is resolved. |
| FR-DASH-005 | Low | OK | Low | Low | PRD itself flags this as vague ("to the extent supported by approved scope"); not testable as written. |
| FR-SETTINGS-001/002 | Low | OK | Low | Low | No settings are enumerated anywhere upstream; currently untestable. |
| FR-QUIZ-001 | Medium | OK | Medium | Medium | Doesn't state the selection criteria for which vocabulary is eligible for a quiz (due items? recently saved? user-chosen?) — Product Discovery §9 mentions "due/recent vocabulary" but PRD does not carry this detail forward. |
| EDGE-002 / EDGE-003 | Medium | OK | Low | Medium | "Too short," "ambiguous," and "insufficient context" are judgment calls without a stated product-level threshold or rule — acceptable at this stage but not yet testable. |

**Consistency:** No internal contradictions were found between individual FR-* requirements. The one notable tension (FR-VOCAB-004 editability vs. FR-VOCAB-006 context preservation) is not a contradiction — FR-VOCAB-006 explicitly permits editing as the exception — but it is under-specified enough to flag (see AMB-01).

**Traceability:** All FR-*, EDGE-*, and FR-PRIV-* requirements trace cleanly to PRD sections, which in turn trace to Product Discovery. See Section 18 for the full matrix.

## 8. Functional Requirement Analysis

### 8.1 Authentication

| ID | Requirement | Priority | Actor | Preconditions | Main Behavior | Expected Result | Dependencies | Source |
|---|---|---|---|---|---|---|---|---|
| FR-AUTH-001 | Register a new account | P0 | Learner | None | User provides required registration input | Account created | None | PRD §9.1 |
| FR-AUTH-002 | Log in | P0 | Learner | Account exists | User provides credentials | Authenticated session begins | FR-AUTH-001 | PRD §9.1 |
| FR-AUTH-003 | Log out | P0 | Learner | Authenticated | User requests logout | Session ends | FR-AUTH-002 | PRD §9.1 |
| FR-AUTH-004 | Maintain session | P0 | Learner, Web App | Authenticated | System persists session across actions | User is not re-prompted mid-session | FR-AUTH-002 | PRD §9.1 |
| FR-AUTH-005 | Basic account management | P1 | Learner | Authenticated | User views/updates account details (scope TBD — see Section 6) | Account details reflect changes | FR-AUTH-002 | PRD §9.1 |
| FR-AUTH-006 | Require authentication for vocabulary actions | P0 | Web App, Extension | None | System checks auth before save/view/review/quiz | Unauthenticated attempts are blocked/redirected | FR-AUTH-002 | PRD §9.1 |

### 8.2 Chrome Extension — Contextual Capture

| ID | Requirement | Priority | Actor | Preconditions | Main Behavior | Expected Result | Dependencies | Source |
|---|---|---|---|---|---|---|---|---|
| FR-EXT-001 | Detect text selection | P0 | Learner, Extension | Extension active on page | User selects text | Extension recognizes selection | None | PRD §9.2 |
| FR-EXT-002 | Capture exact selected text | P0 | Extension | FR-EXT-001 | Extension captures selection verbatim | Selected text stored temporarily for processing | FR-EXT-001 | PRD §9.2 |
| FR-EXT-003 | Capture minimum necessary context only | P0 | Extension | FR-EXT-001 | Extension captures only minimum surrounding context | No full-page content is captured | FR-EXT-001 | PRD §9.2, §11 |
| FR-EXT-004 | Send selection + context to AI | P0 | Extension, AI capability | FR-EXT-002, FR-EXT-003 | Extension sends captured data for analysis | AI receives only selection + minimum context | FR-EXT-002/003, REQ-AI-001 | PRD §9.2 |
| FR-EXT-005 | Show context-appropriate meaning | P0 | Extension, AI capability | FR-EXT-004 succeeds | AI response displayed to user | User sees meaning specific to that occurrence | FR-EXT-004, REQ-AI-001 | PRD §9.2 |
| FR-EXT-006 | Show AI-generated example | P0 | Extension, AI capability | FR-EXT-004 succeeds | Example displayed alongside meaning | User sees a usage example | FR-EXT-004, REQ-AI-002 | PRD §9.2 |
| FR-EXT-007 | Save vocabulary with context | P0 | Learner, Extension | FR-EXT-005/006 shown | User triggers save | Vocabulary + context persisted to account | FR-AUTH-006, FR-VOCAB-001 | PRD §9.2, §9.3 |
| FR-EXT-008 | Link to Web App | P1 | Learner, Extension | Vocabulary saved | User activates link | Web App opens (destination granularity TBD) | FR-EXT-007 | PRD §9.2 |
| FR-EXT-009 | Show loading state | P0 | Extension | FR-EXT-004 in progress | UI reflects "waiting" | User is not left with an unresponsive UI | FR-EXT-004 | PRD §9.2 |
| FR-EXT-010 | Show AI failure state | P0 | Extension | FR-EXT-004 fails | UI reflects failure, not silent | User is informed and can retry | FR-EXT-004, EDGE-004 | PRD §9.2, §12 |
| FR-EXT-011 | Show save failure state | P0 | Extension | FR-EXT-007 fails | UI reflects failure, not silent | User input is not lost silently | FR-EXT-007, EDGE-006 | PRD §9.2, §12 |
| FR-EXT-012 | Privacy boundary | P0 | Extension | Always | Extension restricts processing to selection + minimum context + required metadata | No full-page scanning/transmission ever occurs | FR-EXT-002/003 | PRD §9.2, §11; Discovery §11 |

### 8.3 Vocabulary Management

| ID | Requirement | Priority | Actor | Preconditions | Main Behavior | Expected Result | Dependencies | Source |
|---|---|---|---|---|---|---|---|---|
| FR-VOCAB-001 | View saved vocabulary | P0 | Learner | Authenticated | User opens vocabulary view | List of saved vocabulary shown | FR-AUTH-006 | PRD §9.3 |
| FR-VOCAB-002 | View grouped by item | P0 | Learner | FR-VOCAB-001 | User views by word/phrase | Occurrences grouped under their vocabulary item | FR-VOCAB-001, FR-VOCAB-007 | PRD §9.3 |
| FR-VOCAB-003 | View individual occurrence + context | P0 | Learner | FR-VOCAB-001 | User opens a specific saved entry | Original context is shown | FR-VOCAB-001 | PRD §9.3 |
| FR-VOCAB-004 | Edit saved entry | P1 | Learner | FR-VOCAB-003 | User edits entry (scope TBD — Section 6) | Entry updated | FR-VOCAB-003 | PRD §9.3 |
| FR-VOCAB-005 | Delete saved entry | P0 | Learner | FR-VOCAB-003 | User deletes entry | Entry removed from vocabulary, review, and future quizzes | FR-VOCAB-003 | PRD §9.3 |
| FR-VOCAB-006 | Preserve original context | P0 | Web App | Entry saved | System does not alter context unless user edits/removes it | Context remains stable across time | FR-EXT-007 | PRD §9.3; Discovery §8 |
| FR-VOCAB-007 | Support item/meaning/occurrence distinction | P0 | Web App | Multiple saves of same item | System conceptually distinguishes item, meaning, and occurrence | Same word can carry multiple saved meanings/contexts without collapsing into one | FR-VOCAB-001/002/003 | PRD §9.3; Discovery Vocabulary Domain Note |

### 8.4 Flashcard Review

| ID | Requirement | Priority | Actor | Preconditions | Main Behavior | Expected Result | Dependencies | Source |
|---|---|---|---|---|---|---|---|---|
| FR-REVIEW-001 | Show due vocabulary | P0 | Learner | Vocabulary exists | User opens review | Due items presented | FR-VOCAB-001 | PRD §9.4 |
| FR-REVIEW-002 | Display item + context during review | P0 | Learner | FR-REVIEW-001 | Flashcard shown | Item and context both visible | FR-VOCAB-003 | PRD §9.4 |
| FR-REVIEW-003 | Reveal/check meaning | P0 | Learner | FR-REVIEW-002 | User reveals meaning | Meaning shown on demand | FR-REVIEW-002 | PRD §9.4 |
| FR-REVIEW-004 | Record review performance | P0 | Learner, Web App | FR-REVIEW-003 | User indicates recall result | Performance signal stored (shape TBD — Section 6) | FR-REVIEW-003 | PRD §9.4 |
| FR-REVIEW-005 | Schedule next review from performance | P0 | Web App | FR-REVIEW-004 | System recalculates due date | Item reappears on a performance-based schedule (algorithm deferred) | FR-REVIEW-004 | PRD §9.4, §18 |

### 8.5 Multiple-Choice Quiz

| ID | Requirement | Priority | Actor | Preconditions | Main Behavior | Expected Result | Dependencies | Source |
|---|---|---|---|---|---|---|---|---|
| FR-QUIZ-001 | Generate multiple-choice-only quizzes | P0 | Learner, Web App, AI capability | Vocabulary exists (selection criteria TBD — Section 7) | System builds quiz from vocabulary | Quiz composed entirely of multiple-choice questions | FR-VOCAB-001, REQ-AI-003 | PRD §9.5 |
| FR-QUIZ-002 | Four answer options per question | P0 | Web App | FR-QUIZ-001 | Question rendered with 4 options | Exactly four options shown | FR-QUIZ-001 | PRD §9.5 |
| FR-QUIZ-003 | User selects one answer | P0 | Learner | FR-QUIZ-002 | User picks an option | Selection registered | FR-QUIZ-002 | PRD §9.5 |
| FR-QUIZ-004 | Evaluate answer | P0 | Web App | FR-QUIZ-003 | System checks selection | Correct/incorrect determined deterministically | FR-QUIZ-003 | PRD §9.5, §10 |
| FR-QUIZ-005 | Show result | P0 | Learner | FR-QUIZ-004 | Result displayed | User sees correct/incorrect immediately | FR-QUIZ-004 | PRD §9.5 |
| FR-QUIZ-006 | Show explanation | P0 | Learner | FR-QUIZ-004 | Explanation displayed | User understands correct answer | FR-QUIZ-004 | PRD §9.5 |
| FR-QUIZ-007 | Record result | P0 | Web App | FR-QUIZ-004 | Result stored | Result available for stats/history | FR-QUIZ-004 | PRD §9.5 |
| FR-QUIZ-008 | Update statistics | P0 | Web App | FR-QUIZ-007 | Stats recalculated | Dashboard reflects updated stats | FR-QUIZ-007, FR-DASH-003 | PRD §9.5, §9.6 |

### 8.6 Dashboard

| ID | Requirement | Priority | Actor | Preconditions | Main Behavior | Expected Result | Dependencies | Source |
|---|---|---|---|---|---|---|---|---|
| FR-DASH-001 | Show due-for-review count | P0 | Learner | Authenticated | Dashboard loads | Due count visible | FR-REVIEW-001 | PRD §9.6 |
| FR-DASH-002 | Show recent activity | P0 | Learner | Authenticated | Dashboard loads | Recent saves/reviews/quizzes visible | FR-VOCAB-001, FR-REVIEW-004, FR-QUIZ-007 | PRD §9.6 |
| FR-DASH-003 | Show basic statistics | P0 | Learner | Authenticated | Dashboard loads | Totals (saved, reviewed) visible | FR-VOCAB-001, FR-REVIEW-004 | PRD §9.6 |
| FR-DASH-004 | Show recent quiz results | P0 | Learner | Authenticated | Dashboard loads | Recent results visible | FR-QUIZ-007 | PRD §9.6 |
| FR-DASH-005 | Show progress over time | P1 | Learner | Authenticated | Dashboard loads | Some trend indicator visible (scope TBD — Section 6) | FR-DASH-003 | PRD §9.6 |

### 8.7 Settings

| ID | Requirement | Priority | Actor | Preconditions | Main Behavior | Expected Result | Dependencies | Source |
|---|---|---|---|---|---|---|---|---|
| FR-SETTINGS-001 | View/update basic settings | P1 | Learner | Authenticated | User opens settings (enumeration TBD — Section 13) | Settings updated | FR-AUTH-002 | PRD §9.7 |
| FR-SETTINGS-002 | No complex customization | P0 (constraint) | Product | N/A | N/A (a scope constraint, not a user-facing behavior) | Settings surface stays minimal | FR-SETTINGS-001 | PRD §9.7 |

### 8.8 AI

| ID | Requirement | Priority | Actor | Preconditions | Main Behavior | Expected Result | Dependencies | Source |
|---|---|---|---|---|---|---|---|---|
| REQ-AI-001 | Context-aware meaning generation | P0 | AI capability | Selection + context received | AI analyzes occurrence | Meaning specific to occurrence returned | FR-EXT-004 | PRD §10 |
| REQ-AI-002 | Example generation | P0 | AI capability | Selection + context received | AI generates example | Example returned | FR-EXT-004 | PRD §10 |
| REQ-AI-003 | Quiz question generation | P0 | AI capability | Vocabulary provided | AI generates multiple-choice question(s) | Question + 4 options returned | FR-QUIZ-001 | PRD §10 |

## 9. Requirement Dependencies

High-level dependency chains (product-level, not a technical architecture):

```
Authentication (FR-AUTH-*)
   └─→ Vocabulary ownership (FR-VOCAB-001, FR-EXT-007)
         └─→ Review eligibility (FR-REVIEW-001)
         └─→ Quiz eligibility (FR-QUIZ-001)
         └─→ Dashboard data (FR-DASH-*)

Extension Capture (FR-EXT-001 → 003)
   └─→ AI meaning/example (REQ-AI-001, REQ-AI-002 via FR-EXT-004)
         └─→ Save with context (FR-EXT-007)

Note: AI explanation/example is part of the current capture flow, but the source documents do not explicitly establish successful AI generation as a hard product prerequisite for saving the selected text/context. This is therefore treated as a flow relationship, not a mandatory dependency, until the product decision is made.
               └─→ Vocabulary Management (FR-VOCAB-001 → 007)
                     └─→ Flashcard Review (FR-REVIEW-001 → 005)
                           └─→ Review performance data
                                 └─→ Next-review scheduling (FR-REVIEW-005)
                     └─→ Quiz content pool (FR-QUIZ-001, via REQ-AI-003)
                           └─→ Quiz results (FR-QUIZ-007)
                                 └─→ Dashboard statistics (FR-DASH-002/003/004/008)
```

**Dependency table (selected critical paths):**

| Requirement | Depends On | Why |
|---|---|---|
| FR-EXT-007 (save) | FR-AUTH-006, FR-VOCAB-001; AI output is part of the current flow but not a confirmed hard prerequisite | Save persists the selected vocabulary/context; whether AI content must succeed before save is not explicitly decided in the source documents |
| FR-VOCAB-007 (item/meaning/occurrence) | FR-EXT-007, FR-VOCAB-001/002/003 | The distinction is only meaningful once multiple saves exist and are viewable |
| FR-REVIEW-005 (scheduling) | FR-REVIEW-004 (performance recorded) | Scheduling cannot function without a performance signal, whose shape is still undefined (see AMB-04) |
| FR-QUIZ-001 (quiz generation) | FR-VOCAB-001, REQ-AI-003 | Requires both existing vocabulary and AI question generation |
| FR-DASH-* | FR-VOCAB-*, FR-REVIEW-*, FR-QUIZ-* | Dashboard is a read surface over all upstream activity; it has no independent data of its own |
| FR-EXT-012 (privacy boundary) | FR-EXT-002/003 | The boundary is enforced precisely by how capture is scoped, not as a separate mechanism |

## 10. Requirement Priority

Priorities are normalized to P0/P1/P2 and mapped to the PRD's Must/Should/Could/Out-of-Scope. **Priority and readiness are separate concepts:** a requirement can be P0 while still needing clarification before it is implementation-ready. The former `P0*` notation has been removed.

### 10.1 Priority model

| Priority | Meaning | PRD mapping |
|---|---|---|
| **P0** | Required for the approved MVP | Must Have |
| **P1** | Valuable but not required for MVP | Should Have |
| **P2** | Optional/future scope | Could Have |
| **N/A** | Explicitly outside MVP | Out of Scope |

### 10.2 Normalized priority

| PRD Category | Normalized Priority | Requirements | Readiness note |
|---|---|---|---|
| Must Have | **P0** | FR-AUTH-001–006; FR-EXT-001–012; FR-VOCAB-001–007; FR-REVIEW-001–005; FR-QUIZ-001–008; FR-DASH-001–005; FR-SETTINGS-001–002; FR-PRIV-001–006; REQ-AI-001–003 | Some P0 requirements remain **Needs Clarification/Needs Product Decision**. |
| Should Have | **P1** | Collections/tags, quiz history, richer statistics (named in PRD §16, no FR-IDs assigned yet) | Not part of MVP implementation. |
| Could Have | **P2** | Additional quiz types, CSV/Anki export, in-extension mini review | Not part of MVP implementation. |
| Out of Scope | **N/A** | All items in PRD §4 (Non-Goals) | Explicitly excluded. |

### 10.3 Readiness model

Readiness is tracked independently from priority: **Ready**, **Needs Clarification**, **Needs Product Decision**, or **Deferred**. For example, FR-SETTINGS-001 is P0 because PRD §16 places basic settings in Must Have, but it is not Ready because the actual settings are not enumerated.

This separation prevents an under-specified P0 requirement from being incorrectly counted as P1 and avoids using `P0*` as a hybrid status.

## 11. Non-Functional Requirements

The source documents define almost no explicit non-functional requirements. The items below are extracted where the PRD/Discovery clearly implies a quality attribute; anything with no textual support is marked **Needs Definition** rather than assigned an invented number.

| Attribute | Requirement (as supported by source docs) | Status |
|---|---|---|
| **Reliability / Error Handling** | The system must not fail silently on AI errors, save errors, or network errors (FR-EXT-010/011, EDGE-004–011). | Defined at product level |
| **Data Consistency** | Saved context must remain unaltered unless the user explicitly edits/removes it (FR-VOCAB-006). | Defined at product level |
| **Privacy (data minimization)** | Only user-selected text + minimum necessary context may be captured/transmitted; no full-page capture (FR-PRIV-001–004, FR-EXT-012). | Defined at product level |
| **Usability (transparency)** | The user must be able to understand what content is being processed (FR-PRIV-005). | Defined at product level, but "understand" has no specified mechanism (e.g., inline notice vs. settings page) | 
| **Usability (feedback states)** | Loading/failure states must be visible to the user rather than silent (FR-EXT-009/010/011). | Defined at product level |
| **Performance (response time)** | Not specified anywhere in Product Discovery or PRD. | **Needs Definition** |
| **Availability / Uptime** | Not specified. | **Needs Definition** |
| **Scalability (concurrent users, data volume)** | Not specified. | **Needs Definition** |
| **Accessibility** | Not mentioned in either source document. | **Needs Definition** |
| **Security (beyond privacy boundary)** | Only the Extension's data-minimization boundary is specified; no requirements exist for account security, data encryption, or abuse prevention. | **Needs Definition** |
| **AI cost/rate limiting** | Discovery §15 names AI cost as a risk with a suggested mitigation (caching, rate limits) but does not state this as a hard product requirement. | Mentioned as risk mitigation only — **Needs Definition** as a requirement |

No numeric targets (response time, uptime %, concurrency, token limits) are invented anywhere in this section, per the task constraints.

## 12. Privacy and Data Handling

**Data that is captured (Extension):**
- User-selected text (FR-EXT-002)
- Minimum surrounding context necessary to interpret the selection (FR-EXT-003)

**Data that is stored (Web App, on save):**
- The vocabulary item, its meaning, and its original context/occurrence (FR-VOCAB-006/007)
- Review performance history (FR-REVIEW-004)
- Quiz results (FR-QUIZ-007)
- User account data (necessary for FR-AUTH-*, not further specified)

**Data that may be sent to AI:**
- Selected text + minimum necessary context (FR-EXT-004, REQ-AI-001/002)
- Saved vocabulary needed to generate quiz questions (REQ-AI-003)

**Data that should NOT be captured, stored, or transmitted:**
- Entire webpage content (FR-EXT-012, FR-PRIV-003/004)
- Any browsing content beyond an explicit user selection and its minimum required context (FR-PRIV-001)

**Preserved product boundary:** the Extension's role is capture-only and minimum-context-only; this boundary is treated as inviolable in every relevant requirement (FR-EXT-003/012, FR-PRIV-001–004) and is not weakened anywhere in this analysis.

**Not addressed by source documents (flagged, not invented):**
- Exact data retention duration.
- Whether/how a user can export or fully delete their account data beyond individual vocabulary entries (FR-VOCAB-005 covers entry-level deletion only).
- Whether AI provider processing carries its own data-retention behavior (this is provider-dependent and explicitly deferred — PRD §18).

These gaps are carried into Section 13 (Missing Requirements) rather than resolved here.

## 13. Edge Cases and Failure Scenarios

| Group | ID | Trigger | Expected Behavior | Requirement Affected | Status |
|---|---|---|---|---|---|
| Authentication | EDGE-007 | User not authenticated attempts a gated action | Prompt for authentication; do not partially complete the action | FR-AUTH-006 | Defined |
| Extension | EDGE-001 | No text selected when capture is triggered | No AI request attempted | FR-EXT-001/004 | Defined |
| Extension | EDGE-002 | Selected text too short/ambiguous | Indicate more context or a different selection is needed | FR-EXT-003/005 | Defined, but threshold undefined (see AMB-05) |
| Extension | EDGE-003 | Captured context insufficient to disambiguate | Indicate uncertainty rather than a false-confident answer | FR-EXT-005 | Defined, but "insufficient" has no stated rule (see AMB-05) |
| AI | EDGE-004 | AI request fails (timeout/error) | Clear failure state, retry available | FR-EXT-010 | Defined |
| AI | EDGE-005 | AI returns unusable/malformed content | Must not be saved or shown as valid | FR-EXT-005/006, FR-EXT-007 | Defined, but "unusable" has no stated detection rule (deferred — technical) |
| Vocabulary | EDGE-006 | Save fails | User informed, input not silently lost | FR-EXT-011 | Defined |
| Review | EDGE-010 | No vocabulary due for review | Clear "nothing due" state, not a confusing empty screen | FR-REVIEW-001, FR-DASH-001 | Defined |
| Quiz | EDGE-009 | Quiz generation fails (e.g., insufficient vocabulary) | Inform user, no broken/empty quiz | FR-QUIZ-001 | Defined, but minimum vocabulary threshold for a valid quiz is not stated (see AMB-06) |
| Network / Sync | EDGE-008 | Network fails during capture/save/review/quiz | Clear failure indication | FR-EXT-010/011, general | Defined at a high level; multi-device sync behavior beyond single-action failure is not addressed (see Section 15) |
| User Input | EDGE-011 | New user with no saved vocabulary | Guide user toward capture flow, not an empty unexplained screen | FR-DASH-*, FR-VOCAB-001 | Defined |

No new edge-case UI behavior is invented here beyond what PRD §12 already specifies; thresholds and detection rules that PRD leaves open are called out as ambiguities (Section 14) rather than resolved.

## 14. Ambiguities

| ID | Requirement(s) | Ambiguous Statement | Possible Interpretations | Why It Matters | Recommended Clarification | Status |
|---|---|---|---|---|---|---|
| AMB-01 | FR-VOCAB-004, FR-VOCAB-006 | "Edit a saved vocabulary entry" vs. "preserve original context unless user explicitly edits" | (a) Only the AI-generated meaning/example is editable, original context is read-only; (b) the original context text itself can also be edited/corrected by the user | Determines whether "original context" is an immutable historical record or a user-correctable field — affects trust in the context-preservation value proposition | Decide explicitly whether original context is ever user-editable, or only the meaning/notes layered on top of it | Needs Product Decision |
| AMB-02 | FR-VOCAB-007 | "Same vocabulary item can have multiple distinct meanings" | (a) Each new occurrence always creates a new entry; (b) system attempts to detect and offer merging when the same word+meaning recurs | Affects whether the vocabulary bank grows as a strict log of occurrences or as a curated set with de-duplication | Confirm whether de-duplication/merging is in scope for MVP or deferred | Needs Product Decision |
| AMB-03 | FR-AUTH-005 | "Basic account management" | Could range from "view email/username only" to "update password, delete account, manage sessions" | Cannot be estimated or tested without a defined action set | Enumerate the specific MVP account actions | Needs Product Decision |
| AMB-04 | FR-REVIEW-004 | "Record ... performance (e.g., whether the item was remembered)" | (a) Binary remembered/forgotten; (b) graded confidence scale (e.g., 1–4/5) | Directly determines what data FR-REVIEW-005's scheduling logic will have to work with — a product-level decision, distinct from *which algorithm* is chosen | Decide the shape (binary vs. graded) at the product level, independent of the algorithm choice deferred to Architecture | Needs Product Decision (product-level, not technical) |
| AMB-05 | EDGE-002, EDGE-003 | "Too short," "ambiguous," "insufficient context" | No stated rule for when these conditions trigger | Without a threshold, this behavior can't be objectively tested | Define product-level criteria (even qualitative) for when input is treated as insufficient | Needs Product Decision |
| AMB-06 | EDGE-009 | "Insufficient vocabulary to generate meaningful questions" | No stated minimum vocabulary count | Cannot test the failure path without a defined trigger condition | Define a minimum vocabulary threshold for quiz eligibility | Needs Product Decision |
| AMB-07 | FR-QUIZ-001 | Which vocabulary is eligible for a quiz | Discovery §9 mentions "due/recent vocabulary" as the journey's intent, but PRD §9.5 does not restate a selection rule | Determines whether quizzes always pull from due-for-review items, from all saved vocabulary, or from a mix | Decide and state the eligibility rule explicitly in the next iteration | Needs Product Decision |
| AMB-08 | FR-EXT-008 | "Provide a way to open ... in the Web application" | (a) A generic link to the Web App home/vocabulary list; (b) a deep link to the specific just-saved item | Affects expected user experience and whether deep-linking is a required capability | Decide destination granularity | Needs Product Decision |
| AMB-09 | FR-SETTINGS-001 | "Basic account/learning settings relevant to MVP" | No settings are named anywhere upstream | Nothing can be built or tested from this as written | Enumerate MVP settings explicitly | Needs Product Decision |

No ambiguity above was resolved with a technical decision; all are left open for the product owner, consistent with the task constraints.

## 15. Conflicts and Inconsistencies

A direct comparison of `PRODUCT-DISCOVERY.md` and `PRD.md` was performed. **No significant contradiction was found.** The PRD consistently narrows and operationalizes Product Discovery without overriding it. Minor observations, none of which rise to the level of a conflict:

- **Terminology consistency:** Both documents consistently use "performance-based review scheduling" (not "spaced repetition" as a committed algorithm name) and "meaning-in-context" (not "translation") — no drift detected.
- **Minor detail drop, not a contradiction:** Product Discovery's Core User Journey (§9, step 7) describes the quiz as built from "due/recent vocabulary," but PRD §9.5 does not restate this selection detail (captured above as AMB-07). This is treated as an omission carried forward for clarification, not a contradiction, since PRD never states a conflicting rule — it simply doesn't repeat Discovery's detail.
- **No priority conflicts:** PRD §16's Must/Should/Could/Out-of-Scope breakdown matches Product Discovery §10 exactly, item for item.
- **No duplicate requirements** were found between the two documents — PRD requirements are a strict elaboration of Discovery's higher-level statements, not a parallel or duplicate set.

If a genuine contradiction is discovered in a later phase, it must be reported explicitly rather than silently resolved, consistent with this analysis's approach.

## 16. Missing Requirements

### Critical Missing Requirements
*(Could block implementation or cause major product ambiguity if left unresolved.)*
- **MISSING-01:** No enumeration of MVP account settings (blocks FR-SETTINGS-001/002 from being implementable or testable).
- **MISSING-02:** No defined shape for review-performance input (blocks FR-REVIEW-004/005 from being objectively testable — distinct from the deferred *algorithm* choice).
- **MISSING-03:** No stated vocabulary-eligibility rule for quiz generation (blocks a precise definition of FR-QUIZ-001).

### Important Missing Requirements
*(Should be clarified before implementation if possible, but do not block a first pass at User Stories.)*
- **MISSING-04:** No stated behavior for handling a duplicate save (same item, same occurrence, saved twice) — related to AMB-01/AMB-02.
- **MISSING-05:** No account-level data requirements beyond entry-level deletion (e.g., full account/data deletion, export) — noted in Section 12.
- **MISSING-06:** No stated destination granularity for FR-EXT-008's "open in Web application" link (AMB-08).
- **MISSING-07:** No defined threshold for "too short/ambiguous" selections (EDGE-002/003, AMB-05) or minimum vocabulary count for quiz generation (EDGE-009, AMB-06).

### Optional / Future
*(Can safely be decided later without blocking MVP work.)*
- Multi-device sync behavior beyond single-action network failure (touched on but not deeply specified in EDGE-008).
- Whether AI-generated content can be flagged/reported by the user as incorrect, beyond the general "edit" capability in FR-VOCAB-004.
- Whether quiz explanations link back to the original saved occurrence.

None of the above are added to MVP scope by this document. They are recorded here strictly for product-owner review.

## 17. Acceptance Criteria Readiness

| Requirement Area | Classification | Reason |
|---|---|---|
| Authentication (FR-AUTH-001–004, 006) | **Ready** | Clear, atomic, testable as written |
| Authentication (FR-AUTH-005) | **Needs Clarification** | Action set undefined (AMB-03) |
| Extension capture (FR-EXT-001–007, 009–012) | **Ready** | Clear, atomic, testable |
| Extension link-out (FR-EXT-008) | **Needs Clarification** | Destination granularity undefined (AMB-08) |
| Vocabulary Management (FR-VOCAB-001, 002, 003, 005, 006) | **Ready** | Clear and testable |
| Vocabulary Management (FR-VOCAB-004) | **Needs Clarification** | Editable field scope undefined (AMB-01) |
| Vocabulary Management (FR-VOCAB-007) | **Needs Clarification** | Duplicate/merge behavior undefined (AMB-02) |
| Flashcard Review (FR-REVIEW-001–003) | **Ready** | Clear and testable |
| Flashcard Review (FR-REVIEW-004) | **Needs Clarification** | Performance signal shape undefined (AMB-04) |
| Flashcard Review (FR-REVIEW-005) | **Needs Product Decision (deferred)** | Depends on FR-REVIEW-004 *and* on the scheduling algorithm, which is explicitly deferred to Architecture per PRD §18 |
| Multiple-Choice Quiz (FR-QUIZ-002–008) | **Ready** | Clear and testable |
| Multiple-Choice Quiz (FR-QUIZ-001) | **Needs Clarification** | Vocabulary eligibility rule undefined (AMB-07) |
| Dashboard (FR-DASH-001–004) | **Ready** | Clear and testable |
| Dashboard (FR-DASH-005) | **Needs Clarification** | Trend scope undefined (AMB not separately numbered — see decomposition in Section 6) |
| Settings (FR-SETTINGS-001/002) | **Needs Product Decision** | No settings enumerated at all (AMB-09, MISSING-01) |
| Privacy (FR-PRIV-001–006) | **Ready** | Clear and testable |
| AI (REQ-AI-001–003) | **Ready** at product level; **Deferred** for provider/model specifics | Behavior is clear; implementation is explicitly out of scope for this phase |
| Edge Cases (EDGE-001, 004, 006, 007, 008, 010, 011) | **Ready** | Clear expected behavior |
| Edge Cases (EDGE-002, 003, 005, 009) | **Needs Clarification** | Thresholds/detection rules undefined (AMB-05, AMB-06) |

**Overall:** The majority of Must-Have requirements are ready for direct conversion into User Stories and Acceptance Criteria. A focused set of clarifications (Sections 14 and 16) should be resolved first for the cleanest possible next phase, but none of them require re-opening Product Discovery or PRD — they are refinements within already-approved scope.

## 18. Requirement Traceability Matrix

| Product Discovery | PRD | Requirement | Priority | Status |
|---|---|---|---|---|
| Problem: fragmented lookup tools; §9 loop step 2–3 | §9.2 | FR-EXT-001–007, 009–012 | P0 | Ready |
| Vision: minimal-context capture; §11 Extension responsibilities | §11 | FR-PRIV-001–004, FR-EXT-012 | P0 | Ready |
| Core Value 3: closed-loop retention | §3 G3/G4 | FR-REVIEW-001–003, FR-QUIZ-002–008 | P0 | Ready |
| Core Value 3: performance-based scheduling | §9.4, §18 | FR-REVIEW-004/005 | P0 | Needs Clarification (AMB-04) / Deferred (algorithm) |
| Vocabulary Domain Note: item/meaning/occurrence | §9.3 | FR-VOCAB-001–003, 005–007 | P0 | Ready / Needs Clarification (AMB-02) |
| MVP Scope: basic dashboard | §9.6 | FR-DASH-001–004 | P0 | Ready |
| MVP Scope: basic dashboard, progress over time | §9.6 | FR-DASH-005 | P1 | Needs Clarification |
| MVP Scope: basic settings | §9.7 | FR-SETTINGS-001/002 | P1 | Needs Product Decision |
| Target Users §4 | §5 | (no direct FR — informs all UX-facing requirements) | N/A | Ready (context only) |
| Success Metrics §14 | §13 | Business/Success Requirements | N/A | Ready (measurement, not implementation) |
| Product Hypotheses | §14 | Business/Success Requirements | N/A | Ready (to be validated post-launch, not implemented as a feature) |
| Risks §15 | §15 | Informs FR-EXT-010/011, FR-PRIV-*, FR-VOCAB-004 | N/A | Ready |
| Open Questions / Assumptions §16–17 | §18 | Deferred technical decisions | N/A | Deferred (explicitly, by design) |

No requirement in this matrix originates without a Product Discovery or PRD source; nothing here is marked "Proposed / Needs Confirmation" because no new requirement was introduced during this analysis — only decomposition and clarification of existing ones.

## 19. Requirement Decision Log

| Decision ID | Topic | Current Understanding | Options | Recommended Direction | Status |
|---|---|---|---|---|---|
| DEC-01 | Editable scope of a saved vocabulary entry (AMB-01) | Unclear whether original context is user-editable | (a) Context read-only, meaning/notes editable; (b) both editable | (a) preserves the "original context" value proposition most cleanly | Open — Needs Product Decision |
| DEC-02 | Duplicate/merge behavior for repeated saves (AMB-02) | Unclear whether repeat saves always create new entries or offer merging | (a) Always new entry (simplest for MVP); (b) detect-and-offer-merge | (a) is simpler and lower-risk for MVP; merging can be a Should/Could-Have later | Open — Needs Product Decision |
| DEC-03 | MVP account management scope (AMB-03) | "Basic account management" undefined | Enumerate a minimal set (e.g., view details; update basic profile fields) | Product owner to enumerate; keep minimal per MVP philosophy | Open — Needs Product Decision |
| DEC-04 | Shape of review-performance signal (AMB-04) | Undefined whether binary or graded | (a) Binary remembered/forgotten; (b) graded scale | Product-level choice, independent of which scheduling algorithm is later selected | Open — Needs Product Decision |
| DEC-05 | Insufficient-input thresholds (AMB-05, AMB-06) | No stated rule for "too short," "ambiguous," or "insufficient vocabulary" | Define qualitative product-level criteria now; precise thresholds can be tuned later | Product owner defines qualitative criteria; leave precise tuning to implementation | Open — Needs Product Decision |
| DEC-06 | Quiz vocabulary eligibility rule (AMB-07) | Discovery mentions "due/recent," PRD doesn't restate it | (a) Due-for-review items only; (b) all saved vocabulary; (c) mix | Confirm intent against Discovery's original journey wording | Open — Needs Product Decision |
| DEC-07 | Extension "open in Web App" destination (AMB-08) | Generic vs. deep link undefined | (a) General vocabulary view; (b) deep link to the specific item | Either is MVP-feasible at the product level; pick based on desired UX emphasis | Open — Needs Product Decision |
| DEC-08 | MVP settings enumeration (AMB-09, MISSING-01) | No settings named anywhere upstream | Product owner to name the actual MVP settings list | Cannot proceed to Acceptance Criteria for Settings without this | Open — Needs Product Decision |
| DEC-09 (carried forward, not new) | AI provider/model, SRS algorithm, data model, website scope, auth method, monetization, data retention specifics | Already logged as deferred in PRD §18 | N/A | Deferred to Architecture/Database/API/Business phases, as already approved | Deferred (unchanged) |

## 20. MVP Requirement Summary

Counts below are calculated from the requirement IDs listed in the canonical functional requirement inventory (Sections 5 and 8). Each requirement ID is counted once; readiness does not change priority.

- **P0 functional requirements:** 50 FR-* requirements across Authentication (6), Extension (12), Vocabulary (7), Review (5), Quiz (8), Dashboard (5), Settings (2), plus Privacy (6).
- **P0 AI requirements:** 3 (`REQ-AI-001–003`).
- **P0 total with explicit IDs:** **53 requirements**.
- **P1:** named Should-Have items only (collections/tags, quiz history, richer statistics); these do not yet have FR-IDs, so they are not included in the numbered requirement count.
- **P2:** 3 named Could-Have items (additional quiz types, CSV/Anki export, in-extension mini review); these do not yet have FR-IDs.
- **N/A:** all PRD §4 Non-Goals.

**P0 readiness:** P0 does not mean every requirement is implementation-ready. FR-AUTH-005, FR-EXT-008, FR-VOCAB-004/007, FR-REVIEW-004/005, FR-QUIZ-001, FR-DASH-005, and FR-SETTINGS-001/002 still carry clarification/product-decision status as documented in Sections 6, 14, 16, and 17.

**Critical unresolved decisions:** DEC-01 through DEC-08 (Section 19), with DEC-04 and DEC-08 among the most important because they affect review scheduling and settings readiness.

**Critical dependencies:** Extension capture → AI analysis → save is the current product flow, but **AI success is not treated as a confirmed hard prerequisite for save** because the source documents do not explicitly make that rule. Review performance → scheduling remains a genuine dependency. Vocabulary data → Dashboard/Quiz remains a downstream relationship.

**Requirements ready for User Stories now:** the majority of the P0 set, while the explicitly flagged requirements should carry their readiness status into the next phase rather than being silently guessed.

## 21. Analysis Conclusion

The approved Product Discovery and PRD are substantively consistent with each other — no contradictions were found, only a small number of details (chiefly quiz eligibility and settings enumeration) that Discovery implies but PRD does not fully restate. The requirement set is largely mature enough to proceed to User Stories & Acceptance Criteria for most Must-Have functionality. A focused set of product-level clarifications (DEC-01 through DEC-08, including the not-yet-enumerated MVP settings list) should be resolved by the product owner first, since several of them (particularly the shape of review-performance data and the MVP settings list) would otherwise force the next phase to either guess or stall. None of these clarifications require reopening approved scope, contradicting an existing decision, or making a technical/architectural choice — they are refinements within the already-approved MVP boundary. No new product features were introduced anywhere in this analysis; every requirement discussed traces to `docs/PRODUCT-DISCOVERY.md` or `docs/PRD.md`.
