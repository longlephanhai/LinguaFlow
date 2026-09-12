# Feature Specifications

## 1. Document Overview

### Purpose
This document translates approved User Stories into detailed, product-level feature specifications for LinguaFlow.

### Scope
- Product behavior specification only.
- Covers EPIC-01 through EPIC-10.
- Includes feature behavior, product rules, dependencies, acceptance criteria, and traceability.

### Source Documents
Source of truth, in required order:
1. docs/PRODUCT-DISCOVERY.md
2. docs/PRD.md
3. docs/REQUIREMENTS.md
4. docs/USER-STORIES.md

### Status
Draft for product review.

### Authority / Source-of-Truth Rule
If this document conflicts with source documents, the source documents govern. This document must be corrected to match them.

### How Unresolved Decisions Are Represented
- Needs Product Decision: a product choice is required before the feature can be finalized.
- Needs Clarification: behavior intent exists but is still ambiguous in source documents.
- Deferred: intentionally postponed per source documents.

This document does not invent new scope and does not resolve open product decisions silently.

## 2. Feature Specification Model

Every feature in this document uses this model.

### Feature ID
Stable identifier, for example: FEATURE-AUTH-01, FEATURE-EXT-01, FEATURE-VOCAB-01.

### Feature Name
Human-readable name of the feature.

### Epic
Owning epic identifier and name.

### Purpose
What the feature does at product level.

### User Value
Why the feature exists for learners.

### Actors
Who uses or participates in the feature.

### Trigger
What user/system action starts the feature.

### Preconditions
What must already be true.

### Main Flow
Primary expected product behavior.

### Alternative Flows
Important non-primary product paths.

### Inputs
Information used by the feature.

### Outputs
What users see or what product state changes.

### Product Rules
Business/product constraints.

### Error / Edge Cases
Relevant edge-case handling.

### Dependencies
Upstream/downstream product dependencies.

### Acceptance Criteria
Given / When / Then criteria for Ready features.

### Source User Stories
Traceability to approved stories.

### Source Requirements
Traceability to FR-*, REQ-AI-*, EDGE-*.

### Open Decisions
Unresolved decisions tied to this feature.

Rule for unspecified fields:
If source documents do not define a field, this document states: Not specified in source documents.

## 3. Feature Inventory

### EPIC-01 Authentication
- FEATURE-AUTH-01 Auth access lifecycle (register, login, logout, session, gated actions)
- FEATURE-AUTH-02 Basic account management scope

### EPIC-02 Extension - Contextual Capture
- FEATURE-EXT-01 Selection detection and minimum-context capture
- FEATURE-EXT-02 Contextual AI explanation and example in extension
- FEATURE-EXT-03 Save captured vocabulary occurrence from extension
- FEATURE-EXT-04 Extension to Web handoff destination

### EPIC-03 Vocabulary Management
- FEATURE-VOCAB-01 Vocabulary library viewing and grouping
- FEATURE-VOCAB-02 Preserve occurrence context over time
- FEATURE-VOCAB-03 Vocabulary Item / Meaning / Occurrence distinction
- FEATURE-VOCAB-04 Edit saved vocabulary entry scope
- FEATURE-VOCAB-05 Repeated save and duplicate behavior

### EPIC-04 Flashcard Review
- FEATURE-REVIEW-01 Due review queue and flashcard interaction
- FEATURE-REVIEW-02 Review performance input model
- FEATURE-REVIEW-03 Performance-based next-review scheduling

### EPIC-05 Multiple-Choice Quiz
- FEATURE-QUIZ-01 Quiz generation eligibility and composition
- FEATURE-QUIZ-02 Question answering, feedback, and explanation
- FEATURE-QUIZ-03 Quiz result recording and stats update

### EPIC-06 Dashboard
- FEATURE-DASH-01 Due count and recent activity visibility
- FEATURE-DASH-02 Basic statistics and recent quiz result visibility
- FEATURE-DASH-03 Progress-over-time visibility

### EPIC-07 Settings
- FEATURE-SETTINGS-01 MVP settings definition and management

### EPIC-08 Privacy and Data Handling
- FEATURE-PRIV-01 Explicit-selection capture boundary
- FEATURE-PRIV-02 Processing transparency and retention-status communication

### EPIC-09 AI Capabilities
- FEATURE-AI-01 Product-level AI learning capabilities

### EPIC-10 Error and Edge Cases
- FEATURE-EDGE-01 Unusable AI content guardrail
- FEATURE-EDGE-02 Insufficient or ambiguous capture handling
- FEATURE-EDGE-03 Network-failure handling across core actions
- FEATURE-EDGE-04 Quiz-generation insufficiency handling

All features trace to approved User Stories. No feature exists without source story coverage.

## 4. EPIC-01 - Authentication

### FEATURE-AUTH-01
- Feature Name: Auth access lifecycle
- Epic: EPIC-01 Authentication
- Purpose: Let users register, log in, log out, keep active session continuity, and enforce auth boundary for vocabulary actions.
- User Value: User data and learning activity remain account-bound and persistent.
- Actors: Learner, system.
- Trigger: User selects register, login, logout, or attempts a gated vocabulary action.
- Preconditions: For login/logout/session flows, account/session conditions apply.
- Main Flow:
  1. User registers account.
  2. User logs in successfully.
  3. Session remains active during normal usage.
  4. User performs save/view/review/quiz only while authenticated.
  5. User can log out and session ends.
- Alternative Flows:
  - Invalid login attempt: user remains unauthenticated.
  - Unauthenticated attempt to gated action: product prompts for authentication.
- Inputs: Registration information, login credentials, user action signals.
- Outputs: Authenticated state transitions, gated-action allow/deny behavior.
- Product Rules:
  - Authentication required before save/view/review/quiz.
  - Session continuity expected within active session.
- Error / Edge Cases: EDGE-007.
- Dependencies: None hard upstream; downstream dependency for most product flows.
- Acceptance Criteria:
  - Given an unregistered learner, when registration is completed, then a new account exists.
  - Given valid credentials, when learner logs in, then an authenticated session begins.
  - Given authenticated learner, when learner performs multiple actions in one session, then re-login is not required for each action.
  - Given unauthenticated learner, when learner attempts save/view/review/quiz, then action is blocked and auth prompt is shown.
  - Given authenticated learner, when learner logs out, then gated actions are no longer allowed until next login.
- Source User Stories: US-001, US-002, US-003, US-004, US-006.
- Source Requirements: FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-AUTH-004, FR-AUTH-006, EDGE-007.
- Open Decisions: Not specified in source documents.

### FEATURE-AUTH-02
- Feature Name: Basic account management scope
- Epic: EPIC-01 Authentication
- Purpose: Define what account-management actions are included in MVP.
- User Value: Users can maintain account information relevant to MVP.
- Actors: Learner.
- Trigger: User opens account management area.
- Preconditions: Authenticated session.
- Main Flow: Not specified in source documents.
- Alternative Flows: Not specified in source documents.
- Inputs: Not specified in source documents.
- Outputs: Not specified in source documents.
- Product Rules: Account-management behavior must remain within MVP scope.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-AUTH-01.
- Acceptance Criteria: Cannot be finalized until account-management actions are explicitly enumerated.
- Source User Stories: US-005.
- Source Requirements: FR-AUTH-005.
- Open Decisions: DEC-03 (account management actions) - Needs Product Decision.

## 5. EPIC-02 - Extension - Contextual Capture

### FEATURE-EXT-01
- Feature Name: Selection detection and minimum-context capture
- Epic: EPIC-02 Extension - Contextual Capture
- Purpose: Start capture only from explicit user selection and include only minimum necessary context.
- User Value: Fast in-page capture with bounded data collection.
- Actors: Learner, extension.
- Trigger: User selects text and triggers capture.
- Preconditions: Extension active on supported page.
- Main Flow:
  1. Extension detects selection.
  2. Extension captures exact selected text.
  3. Extension captures minimum necessary surrounding context.
  4. Extension sends only required capture payload for analysis.
- Alternative Flows:
  - No selection: no AI request.
- Inputs: Selected text, minimum necessary surrounding context.
- Outputs: Capture payload ready for contextual analysis.
- Product Rules:
  - No passive whole-page scanning.
  - No full-page transmission.
- Error / Edge Cases: EDGE-001.
- Dependencies: Hard downstream dependency for EXT AI and save features.
- Acceptance Criteria:
  - Given extension active, when learner selects text, then selection is detected.
  - Given selected text, when capture occurs, then captured text exactly matches selection.
  - Given capture request, when context is collected, then only minimum necessary context is included.
  - Given no selected text, when capture is triggered, then no AI request is made.
- Source User Stories: US-007, US-008, US-009, US-010.
- Source Requirements: FR-EXT-001, FR-EXT-002, FR-EXT-003, FR-EXT-004, FR-EXT-012, EDGE-001.
- Open Decisions: Not specified in source documents.

### FEATURE-EXT-02
- Feature Name: Contextual AI explanation and example in extension
- Epic: EPIC-02 Extension - Contextual Capture
- Purpose: Present context-appropriate meaning and example for selected occurrence.
- User Value: Learner understands usage in the encountered context.
- Actors: Learner, extension, AI capability.
- Trigger: AI analysis is requested for capture payload.
- Preconditions: Selection and minimum context captured.
- Main Flow:
  1. Extension shows loading state while waiting for AI.
  2. Meaning/explanation and example are shown when response is successful.
- Alternative Flows:
  - AI request failure: clear failure state, retry path.
- Inputs: Selected text, minimum context.
- Outputs: Contextual meaning and example visible in extension.
- Product Rules:
  - Explanation must be context-aware, not generic dictionary-only behavior.
- Error / Edge Cases: EDGE-004.
- Dependencies: Normal flow relationship from FEATURE-EXT-01.
- Acceptance Criteria:
  - Given successful analysis, when response arrives, then contextual meaning and related example are shown.
  - Given pending response, when awaiting AI output, then loading state is visible.
  - Given AI request failure, when response fails, then clear failure state is shown and retry is available.
- Source User Stories: US-011, US-012, US-015, US-016.
- Source Requirements: FR-EXT-005, FR-EXT-006, FR-EXT-009, FR-EXT-010, REQ-AI-001, REQ-AI-002, EDGE-004.
- Open Decisions: DEC-05 for ambiguous/insufficient input thresholds is handled in FEATURE-EDGE-02.

### FEATURE-EXT-03
- Feature Name: Save captured vocabulary occurrence from extension
- Epic: EPIC-02 Extension - Contextual Capture
- Purpose: Save selected vocabulary occurrence with context in one action.
- User Value: Captured learning moment becomes durable and reviewable.
- Actors: Learner, extension, system.
- Trigger: User selects save action in extension.
- Preconditions: Learner authenticated; capture payload exists.
- Main Flow:
  1. User triggers save.
  2. Product persists vocabulary item, meaning, and occurrence context.
  3. Saved data is available in Web vocabulary views.
- Alternative Flows:
  - Save failure: clear failure state; no silent discard.
- Inputs: Selected text, context, associated meaning/example content.
- Outputs: Saved vocabulary occurrence linked to learner account.
- Product Rules:
  - Saving occurs as one action from extension flow.
  - Source documents do not establish AI success as a confirmed hard prerequisite for save.
- Error / Edge Cases: EDGE-006.
- Dependencies:
  - Hard: FEATURE-AUTH-01 auth gate.
  - Flow relationship: AI explanation/example is normal flow but not confirmed hard prerequisite.
- Acceptance Criteria:
  - Given authenticated learner and captured occurrence, when learner saves, then vocabulary occurrence is persisted with context in one action.
  - Given successful save, when learner opens vocabulary in Web app, then saved occurrence is retrievable.
  - Given save failure, when save request fails, then clear failure state is shown and input is not silently discarded.
- Source User Stories: US-013, US-017.
- Source Requirements: FR-EXT-007, FR-EXT-011, FR-AUTH-006, EDGE-006.
- Open Decisions: Not specified in source documents.

### FEATURE-EXT-04
- Feature Name: Extension to Web handoff destination
- Epic: EPIC-02 Extension - Contextual Capture
- Purpose: Define where extension opens learner in Web app after save.
- User Value: Smooth transition from capture surface to management/review surface.
- Actors: Learner, extension.
- Trigger: User chooses open in Web action from extension.
- Preconditions: Save completed.
- Main Flow: Not specified in source documents.
- Alternative Flows: Not specified in source documents.
- Inputs: User open-in-Web action.
- Outputs: Web app opens at intended destination.
- Product Rules: Destination may be general vocabulary area or specific item destination; unresolved.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-EXT-03.
- Acceptance Criteria: Cannot be finalized until destination granularity is decided.
- Source User Stories: US-014.
- Source Requirements: FR-EXT-008.
- Open Decisions: DEC-07 - Needs Product Decision.

## 6. EPIC-03 - Vocabulary Management

### FEATURE-VOCAB-01
- Feature Name: Vocabulary library viewing and grouping
- Epic: EPIC-03 Vocabulary Management
- Purpose: Let learners view saved vocabulary list, group by item, and inspect individual occurrence.
- User Value: Learners can browse and revisit captured vocabulary in meaningful structure.
- Actors: Learner, web app.
- Trigger: Learner opens vocabulary views.
- Preconditions: Authenticated; saved vocabulary exists for non-empty state.
- Main Flow:
  1. Learner opens vocabulary list.
  2. Learner can switch to grouped-by-item view.
  3. Learner opens individual occurrence detail with original context.
- Alternative Flows:
  - No vocabulary: guided empty-state behavior covered in FEATURE-EDGE-04 and US-059.
- Inputs: Learner navigation and selection actions.
- Outputs: Vocabulary list/group/detail views.
- Product Rules:
  - Grouping is by vocabulary item.
  - Occurrence detail must include original context.
- Error / Edge Cases: EDGE-011 link to empty-state guidance.
- Dependencies: FEATURE-EXT-03, FEATURE-AUTH-01.
- Acceptance Criteria:
  - Given authenticated learner with saved vocabulary, when opening vocabulary area, then saved vocabulary is shown.
  - Given multiple occurrences for same item, when grouped view is used, then occurrences appear under same item group.
  - Given learner opens one occurrence, when detail view loads, then original context is shown with that occurrence.
- Source User Stories: US-019, US-020, US-021.
- Source Requirements: FR-VOCAB-001, FR-VOCAB-002, FR-VOCAB-003, EDGE-011.
- Open Decisions: Not specified in source documents.

### FEATURE-VOCAB-02
- Feature Name: Preserve occurrence context over time
- Epic: EPIC-03 Vocabulary Management
- Purpose: Keep original saved context stable unless explicitly changed by user action.
- User Value: Trust in historical learning context.
- Actors: Learner, web app.
- Trigger: Learner revisits saved occurrence over time.
- Preconditions: Occurrence has been saved.
- Main Flow: Saved context remains unchanged when no explicit edit/remove action occurs.
- Alternative Flows: Explicit edit/remove behavior depends on unresolved editability scope decision.
- Inputs: Saved occurrence context.
- Outputs: Stable context presentation.
- Product Rules: Context is preserved by default.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-EXT-03.
- Acceptance Criteria:
  - Given saved occurrence, when learner has not explicitly edited or removed it, then original context remains unchanged over time.
- Source User Stories: US-024.
- Source Requirements: FR-VOCAB-006.
- Open Decisions: Linked with DEC-01 because editability scope influences exception behavior.

### FEATURE-VOCAB-03
- Feature Name: Vocabulary Item / Meaning / Occurrence distinction
- Epic: EPIC-03 Vocabulary Management
- Purpose: Preserve conceptual separation of item, meaning-in-context, and occurrence.
- User Value: Same word can remain meaningfully represented across different contexts.
- Actors: Learner, web app.
- Trigger: Learner views item with multiple occurrences.
- Preconditions: At least two saved occurrences for same item with different contextual meanings.
- Main Flow:
  1. Learner opens vocabulary item.
  2. Product shows distinct meanings tied to distinct occurrences.
- Alternative Flows: Not specified in source documents.
- Inputs: Saved item-level and occurrence-level vocabulary data.
- Outputs: Distinct occurrence-linked meanings under same item.
- Product Rules:
  - Must not flatten Item/Meaning/Occurrence into one generic record concept at product level.
- Error / Edge Cases: Repeated save behavior handled separately in FEATURE-VOCAB-05.
- Dependencies: FEATURE-VOCAB-01, FEATURE-EXT-03.
- Acceptance Criteria:
  - Given same item saved from different contexts with different meanings, when learner views that item, then each meaning remains distinct and tied to its own occurrence.
- Source User Stories: US-025.
- Source Requirements: FR-VOCAB-007.
- Open Decisions: DEC-02 affects repeated-save behavior but not the conceptual distinction itself.

### FEATURE-VOCAB-04
- Feature Name: Edit saved vocabulary entry scope
- Epic: EPIC-03 Vocabulary Management
- Purpose: Define editable fields for a saved entry.
- User Value: Learner can correct/improve saved learning data with clear rules.
- Actors: Learner.
- Trigger: Learner initiates edit on saved entry.
- Preconditions: Authenticated; occurrence detail available.
- Main Flow: Not specified in source documents.
- Alternative Flows: Not specified in source documents.
- Inputs: User edit intent.
- Outputs: Updated entry fields.
- Product Rules:
  - Must remain consistent with context-preservation rule.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-VOCAB-01, FEATURE-VOCAB-02.
- Acceptance Criteria: Cannot be finalized until editable field scope is decided.
- Source User Stories: US-022.
- Source Requirements: FR-VOCAB-004.
- Open Decisions: DEC-01 - Needs Product Decision.

### FEATURE-VOCAB-05
- Feature Name: Repeated save and duplicate behavior
- Epic: EPIC-03 Vocabulary Management
- Purpose: Define product behavior when same item/occurrence is saved again.
- User Value: Avoid confusing duplicate handling.
- Actors: Learner, extension/web app.
- Trigger: Learner repeats save on same or similar vocabulary occurrence.
- Preconditions: Existing saved vocabulary item and/or occurrence.
- Main Flow: Not specified in source documents.
- Alternative Flows: Not specified in source documents.
- Inputs: Repeated save action.
- Outputs: Product duplicate-handling outcome.
- Product Rules: Must respect Item/Meaning/Occurrence conceptual model.
- Error / Edge Cases: Related to duplicate ambiguity, not represented as EDGE-* requirement.
- Dependencies: FEATURE-EXT-03, FEATURE-VOCAB-03.
- Acceptance Criteria: Cannot be finalized until repeated-save/duplicate policy is decided.
- Source User Stories: US-026.
- Source Requirements: FR-VOCAB-007.
- Open Decisions: DEC-02 - Needs Product Decision.

## 7. EPIC-04 - Flashcard Review

### FEATURE-REVIEW-01
- Feature Name: Due review queue and flashcard interaction
- Epic: EPIC-04 Flashcard Review
- Purpose: Show due vocabulary and support context-based recall check flow.
- User Value: Learner knows what to review and can verify recall in context.
- Actors: Learner, web app.
- Trigger: Learner opens review area.
- Preconditions: Authenticated; saved vocabulary exists.
- Main Flow:
  1. Product shows due items.
  2. Flashcard displays item and original context.
  3. Learner reveals/checks meaning.
- Alternative Flows:
  - No due items: clear nothing-due state.
- Inputs: Due item list, learner reveal action.
- Outputs: Flashcard display and learner-visible due/empty state.
- Product Rules:
  - Review must remain performance-based in overall model.
- Error / Edge Cases: EDGE-010.
- Dependencies: FEATURE-VOCAB-01 and auth boundary.
- Acceptance Criteria:
  - Given due vocabulary exists, when learner opens review, then due items are shown.
  - Given due item is shown, when flashcard appears, then item and original context are visible.
  - Given flashcard presented, when learner reveals/checks meaning, then associated meaning is shown.
  - Given no items are due, when learner opens review, then clear nothing-due state is shown.
- Source User Stories: US-027, US-028, US-029.
- Source Requirements: FR-REVIEW-001, FR-REVIEW-002, FR-REVIEW-003, EDGE-010.
- Open Decisions: Not specified in source documents.

### FEATURE-REVIEW-02
- Feature Name: Review performance input model
- Epic: EPIC-04 Flashcard Review
- Purpose: Define how learner performance is recorded per reviewed item.
- User Value: Enables fair performance-based scheduling.
- Actors: Learner, web app.
- Trigger: Learner submits review performance for an item.
- Preconditions: Flashcard meaning has been checked.
- Main Flow: Not specified in source documents.
- Alternative Flows: Not specified in source documents.
- Inputs: Learner performance signal.
- Outputs: Stored performance record per reviewed item.
- Product Rules:
  - Performance record is required input to scheduling.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-REVIEW-01.
- Acceptance Criteria: Cannot be finalized until performance signal shape is decided.
- Source User Stories: US-030.
- Source Requirements: FR-REVIEW-004.
- Open Decisions: DEC-04 - Needs Product Decision.

### FEATURE-REVIEW-03
- Feature Name: Performance-based next-review scheduling
- Epic: EPIC-04 Flashcard Review
- Purpose: Schedule next review using recorded performance.
- User Value: Learner gets adaptive review timing based on recall outcomes.
- Actors: Web app.
- Trigger: Performance record is saved.
- Preconditions: Defined performance input model.
- Main Flow: Not specified in source documents.
- Alternative Flows: Not specified in source documents.
- Inputs: Stored performance signals.
- Outputs: Next-review scheduling outcomes.
- Product Rules:
  - Scheduling must be performance-based.
  - Exact algorithm is intentionally unspecified.
- Error / Edge Cases: Not specified in source documents.
- Dependencies:
  - Hard: FEATURE-REVIEW-02.
  - Unresolved: algorithm selection deferred.
- Acceptance Criteria: Deferred until product decision on performance model and later technical algorithm design.
- Source User Stories: US-031.
- Source Requirements: FR-REVIEW-005.
- Open Decisions: DEC-04 plus deferred scheduling algorithm decision (PRD open decision list).

## 8. EPIC-05 - Multiple-Choice Quiz

### FEATURE-QUIZ-01
- Feature Name: Quiz generation eligibility and composition
- Epic: EPIC-05 Multiple-Choice Quiz
- Purpose: Generate multiple-choice quiz from eligible saved vocabulary.
- User Value: Learner receives structured retention checks from personal vocabulary.
- Actors: Learner, web app, AI capability.
- Trigger: Learner starts quiz generation.
- Preconditions: Vocabulary exists.
- Main Flow:
  1. Product selects eligible vocabulary pool.
  2. Product generates multiple-choice questions.
  3. Each question presents exactly four options.
- Alternative Flows:
  - Quiz generation fails due to insufficiency (covered in FEATURE-EDGE-04).
- Inputs: Eligible vocabulary pool.
- Outputs: Multiple-choice quiz questions.
- Product Rules:
  - MVP quiz type is Multiple Choice only.
  - Exactly four options per question.
- Error / Edge Cases: EDGE-009 dependency for insufficient pool handling.
- Dependencies: FEATURE-VOCAB-01, FEATURE-AI-01.
- Acceptance Criteria: Cannot be finalized until eligibility rule is decided.
- Source User Stories: US-032, US-033.
- Source Requirements: FR-QUIZ-001, FR-QUIZ-002, REQ-AI-003.
- Open Decisions: DEC-06 (eligibility rule) - Needs Product Decision.

### FEATURE-QUIZ-02
- Feature Name: Question answering, feedback, and explanation
- Epic: EPIC-05 Multiple-Choice Quiz
- Purpose: Let learner answer one option and receive immediate correctness feedback with explanation.
- User Value: Learner verifies recall and understands correct answer rationale.
- Actors: Learner, web app.
- Trigger: Learner answers a quiz question.
- Preconditions: Generated quiz question exists with four options.
- Main Flow:
  1. Learner selects one answer.
  2. Product evaluates answer deterministically.
  3. Product shows correct/incorrect immediately.
  4. Product shows explanation.
- Alternative Flows: Not specified in source documents.
- Inputs: Learner selected answer.
- Outputs: Correctness result and explanation.
- Product Rules:
  - One answer selection per question.
  - Immediate feedback behavior.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-QUIZ-01.
- Acceptance Criteria:
  - Given question with four options, when learner selects one option, then selection is registered.
  - Given registered selection, when evaluated, then result is marked correct/incorrect deterministically.
  - Given evaluation complete, when result is shown, then immediate correctness and explanation are visible.
- Source User Stories: US-034, US-035, US-036, US-037.
- Source Requirements: FR-QUIZ-003, FR-QUIZ-004, FR-QUIZ-005, FR-QUIZ-006.
- Open Decisions: Not specified in source documents.

### FEATURE-QUIZ-03
- Feature Name: Quiz result recording and stats update
- Epic: EPIC-05 Multiple-Choice Quiz
- Purpose: Persist question outcomes and update learner statistics.
- User Value: Quiz activity contributes to progress visibility.
- Actors: Web app.
- Trigger: Question evaluation completes.
- Preconditions: Answer has been evaluated.
- Main Flow:
  1. Product records question result.
  2. Product updates learning statistics.
- Alternative Flows: Not specified in source documents.
- Inputs: Evaluated correctness result.
- Outputs: Stored quiz result and updated statistics for dashboard.
- Product Rules: Stats update is downstream of recorded quiz result.
- Error / Edge Cases: Network-failure behavior covered in FEATURE-EDGE-03.
- Dependencies: FEATURE-QUIZ-02, FEATURE-DASH-02.
- Acceptance Criteria:
  - Given evaluated quiz answer, when recording occurs, then result is stored.
  - Given stored result, when statistics refresh, then dashboard-visible statistics reflect the new quiz outcome.
- Source User Stories: US-038, US-039.
- Source Requirements: FR-QUIZ-007, FR-QUIZ-008.
- Open Decisions: Not specified in source documents.

## 9. EPIC-06 - Dashboard

### FEATURE-DASH-01
- Feature Name: Due count and recent activity visibility
- Epic: EPIC-06 Dashboard
- Purpose: Show due-for-review load and recent learning activity summary.
- User Value: Learner sees immediate work queue and recent momentum.
- Actors: Learner, web app.
- Trigger: Learner opens dashboard.
- Preconditions: Authenticated session.
- Main Flow:
  1. Product displays due-for-review count.
  2. Product displays recent saves/reviews/quizzes summary.
- Alternative Flows: Empty-state guidance handled in FEATURE-EDGE-04.
- Inputs: Review queue and recent activity records.
- Outputs: Dashboard due count and recent activity sections.
- Product Rules: Dashboard remains basic in MVP.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-REVIEW-01, FEATURE-VOCAB-01, FEATURE-QUIZ-03.
- Acceptance Criteria:
  - Given authenticated learner with due items, when dashboard opens, then due count is visible.
  - Given recent learning activity exists, when dashboard opens, then recent activity summary is visible.
- Source User Stories: US-040, US-041.
- Source Requirements: FR-DASH-001, FR-DASH-002.
- Open Decisions: Not specified in source documents.

### FEATURE-DASH-02
- Feature Name: Basic statistics and recent quiz result visibility
- Epic: EPIC-06 Dashboard
- Purpose: Show basic totals and recent quiz outcomes.
- User Value: Learner can verify cumulative progress and recent quiz performance.
- Actors: Learner, web app.
- Trigger: Learner opens dashboard.
- Preconditions: Authenticated session.
- Main Flow:
  1. Product shows basic learning totals.
  2. Product shows recent quiz results.
- Alternative Flows: Not specified in source documents.
- Inputs: Saved/reviewed totals and quiz result history.
- Outputs: Dashboard statistics and recent quiz result sections.
- Product Rules: Stats are basic MVP-level visibility.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-QUIZ-03, FEATURE-VOCAB-01, FEATURE-REVIEW-01.
- Acceptance Criteria:
  - Given learner has saved/reviewed activity, when dashboard opens, then basic totals are shown.
  - Given learner has quiz history, when dashboard opens, then recent quiz results are shown.
- Source User Stories: US-042, US-043.
- Source Requirements: FR-DASH-003, FR-DASH-004.
- Open Decisions: Not specified in source documents.

### FEATURE-DASH-03
- Feature Name: Progress-over-time visibility
- Epic: EPIC-06 Dashboard
- Purpose: Define product behavior for trend/progress-over-time presentation.
- User Value: Learner can understand trajectory, not only snapshots.
- Actors: Learner, web app.
- Trigger: Learner opens dashboard progress area.
- Preconditions: Authenticated session and historical activity records.
- Main Flow: Not specified in source documents.
- Alternative Flows: Not specified in source documents.
- Inputs: Not specified in source documents.
- Outputs: Not specified in source documents.
- Product Rules:
  - Must remain within basic MVP dashboard scope.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-DASH-02.
- Acceptance Criteria: Cannot be finalized until metric/time-range/progress representation is decided.
- Source User Stories: US-044.
- Source Requirements: FR-DASH-005.
- Open Decisions: Unlogged decision gap in source set for FR-DASH-005/US-044 - Needs Product Decision.

## 10. EPIC-07 - Settings

### FEATURE-SETTINGS-01
- Feature Name: MVP settings definition and management
- Epic: EPIC-07 Settings
- Purpose: Define and support MVP-relevant basic settings.
- User Value: Learner can adjust approved settings that support core loop.
- Actors: Learner, web app.
- Trigger: Learner opens settings.
- Preconditions: Authenticated session.
- Main Flow: Not specified in source documents.
- Alternative Flows: Not specified in source documents.
- Inputs: Not specified in source documents.
- Outputs: Not specified in source documents.
- Product Rules:
  - Do not introduce complex customization beyond MVP.
  - Actual MVP settings are unresolved.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-AUTH-01.
- Acceptance Criteria: Cannot be finalized until MVP settings list is decided.
- Source User Stories: US-045.
- Source Requirements: FR-SETTINGS-001, FR-SETTINGS-002.
- Open Decisions: DEC-08 - Needs Product Decision.

## 11. EPIC-08 - Privacy and Data Handling

### FEATURE-PRIV-01
- Feature Name: Explicit-selection capture boundary
- Epic: EPIC-08 Privacy and Data Handling
- Purpose: Enforce strict extension capture boundary around explicit selection and minimum context.
- User Value: Learner can trust bounded data handling.
- Actors: Learner, extension.
- Trigger: User selection and capture action.
- Preconditions: Extension active.
- Main Flow:
  1. Capture starts only from explicit user selection.
  2. Product captures minimum necessary context only.
  3. Product does not passively scan whole page.
  4. Product does not transmit whole page to AI.
- Alternative Flows: Not specified in source documents.
- Inputs: User selection and surrounding minimal context.
- Outputs: Privacy-bounded capture payload.
- Product Rules:
  - No passive whole-page scanning.
  - No unrelated page-content collection/transmission.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-EXT-01.
- Acceptance Criteria:
  - Given no text selection, when extension is active, then no capture is initiated.
  - Given selected text, when capture runs, then only minimum necessary context is included.
  - Given extension active, when learner is browsing without capture trigger, then passive whole-page scanning does not occur.
  - Given AI request from capture flow, when transmission occurs, then full page is not transmitted.
- Source User Stories: US-046, US-047, US-048, US-049.
- Source Requirements: FR-PRIV-001, FR-PRIV-002, FR-PRIV-003, FR-PRIV-004.
- Open Decisions: Not specified in source documents.

### FEATURE-PRIV-02
- Feature Name: Processing transparency and retention-status communication
- Epic: EPIC-08 Privacy and Data Handling
- Purpose: Ensure users can understand processing boundary and are not misled about unresolved retention specifics.
- User Value: Product trust through transparent boundary communication.
- Actors: Learner, product surfaces.
- Trigger: Learner checks how capture data is processed or reads privacy statements.
- Preconditions: None.
- Main Flow:
  1. Product communicates that only selection and minimal context are processed for contextual learning action.
  2. Product does not claim finalized retention duration when policy is unresolved.
- Alternative Flows: Not specified in source documents.
- Inputs: User inquiry/view of product messaging.
- Outputs: User-visible understanding of processing boundary and retention-status honesty.
- Product Rules:
  - Transparency required at product level.
  - Retention specifics remain open decision until finalized.
- Error / Edge Cases: Not specified in source documents.
- Dependencies: FEATURE-PRIV-01.
- Acceptance Criteria:
  - Given learner uses capture flow, when learner checks what is processed, then product-level communication makes clear only selection plus minimum context are processed.
  - Given retention policy specifics are unresolved, when privacy posture is communicated, then product does not claim unapproved retention period.
- Source User Stories: US-050, US-051.
- Source Requirements: FR-PRIV-005, FR-PRIV-006.
- Open Decisions: Retention specifics remain open per source documents.

## 12. EPIC-09 - AI Capabilities

### FEATURE-AI-01
- Feature Name: Product-level AI learning capabilities
- Epic: EPIC-09 AI Capabilities
- Purpose: Provide contextual meaning, contextual example, and MCQ question generation at product level.
- User Value: Learner receives contextual understanding and quiz content from saved vocabulary.
- Actors: AI capability, extension, web app, learner.
- Trigger:
  - Extension requests contextual meaning/example for selected occurrence.
  - Web app requests MCQ generation from eligible vocabulary.
- Preconditions:
  - For contextual analysis: selected text and minimum context available.
  - For quiz generation: eligible vocabulary input available.
- Main Flow:
  1. AI returns context-aware meaning.
  2. AI returns related example.
  3. AI returns multiple-choice question content for quiz flow.
- Alternative Flows:
  - AI request failure behavior handled by FEATURE-EXT-02 and FEATURE-EDGE-04.
- Inputs: Selected text, minimum context, eligible vocabulary.
- Outputs: Meaning, example, MCQ content.
- Product Rules:
  - AI behavior remains provider-agnostic.
  - No model/provider/infrastructure details in this specification.
- Error / Edge Cases: EDGE-004, EDGE-005, EDGE-009 (through dependent features).
- Dependencies: FEATURE-EXT-01, FEATURE-QUIZ-01.
- Acceptance Criteria:
  - Given selected text and minimum context, when contextual analysis is requested, then AI output includes occurrence-specific meaning.
  - Given selected text and minimum context, when example generation is requested, then related example is provided.
  - Given eligible vocabulary pool, when quiz generation is requested, then MCQ-compatible question content is produced.
- Source User Stories: US-052, US-053, US-054.
- Source Requirements: REQ-AI-001, REQ-AI-002, REQ-AI-003.
- Open Decisions: Provider/model selection remains deferred per source documents.

## 13. EPIC-10 - Error and Edge Cases

### FEATURE-EDGE-01
- Feature Name: Unusable AI content guardrail
- Epic: EPIC-10 Error and Edge Cases
- Purpose: Prevent unusable/malformed AI output from being treated as valid learning content.
- User Value: Learner is protected from low-quality or broken content.
- Actors: Learner, extension/web surfaces.
- Trigger: AI returns unusable or malformed content.
- Preconditions: AI response exists.
- Main Flow: Not specified in source documents.
- Alternative Flows: Not specified in source documents.
- Inputs: AI response payload.
- Outputs: User is not shown/saving unusable content as valid explanation.
- Product Rules: Unusable AI output must not be accepted as valid.
- Error / Edge Cases: EDGE-005.
- Dependencies: FEATURE-EXT-02, FEATURE-EXT-03.
- Acceptance Criteria: Deferred until detection criteria are concretely defined in later phase.
- Source User Stories: US-055.
- Source Requirements: EDGE-005.
- Open Decisions: Detection specifics deferred (not resolved in source docs).

### FEATURE-EDGE-02
- Feature Name: Insufficient or ambiguous capture handling
- Epic: EPIC-10 Error and Edge Cases
- Purpose: Handle selections/contexts that cannot be reliably interpreted.
- User Value: Learner gets clear guidance instead of misleading confidence.
- Actors: Learner, extension.
- Trigger: Selection/context quality is insufficient or ambiguous.
- Preconditions: Capture request attempted.
- Main Flow: Product indicates insufficiency/ambiguity and asks for better selection/context.
- Alternative Flows: Not specified in source documents.
- Inputs: Selected text and captured context.
- Outputs: User-visible insufficiency/ambiguity messaging.
- Product Rules: Do not present low-confidence result as authoritative.
- Error / Edge Cases: EDGE-002, EDGE-003.
- Dependencies: FEATURE-EXT-01, FEATURE-EXT-02.
- Acceptance Criteria: Cannot be finalized until insufficient/ambiguous trigger criteria are decided.
- Source User Stories: US-056.
- Source Requirements: EDGE-002, EDGE-003.
- Open Decisions: DEC-05 - Needs Product Decision.

### FEATURE-EDGE-03
- Feature Name: Network-failure handling across core actions
- Epic: EPIC-10 Error and Edge Cases
- Purpose: Provide clear failure indication for network failures during core learning actions.
- User Value: Learner is informed that action did not complete.
- Actors: Learner, extension/web app.
- Trigger: Network interruption during capture/save/review/quiz actions.
- Preconditions: Action in progress.
- Main Flow: Product surfaces clear network-failure state.
- Alternative Flows: Retry behavior is feature-dependent and not fully specified as global rule.
- Inputs: Action request plus network failure condition.
- Outputs: User-visible failure notification.
- Product Rules: No silent failure.
- Error / Edge Cases: EDGE-008.
- Dependencies: FEATURE-EXT-02, FEATURE-EXT-03, FEATURE-REVIEW-01, FEATURE-QUIZ-01.
- Acceptance Criteria:
  - Given network fails during capture/save/review/quiz action, when failure occurs, then learner sees clear failure indication instead of silent failure.
- Source User Stories: US-057.
- Source Requirements: EDGE-008.
- Open Decisions: Not specified in source documents.

### FEATURE-EDGE-04
- Feature Name: Quiz-generation insufficiency handling and empty-state guidance
- Epic: EPIC-10 Error and Edge Cases
- Purpose: Handle quiz insufficiency and new-user/no-vocabulary state with clear user guidance.
- User Value: Learner avoids broken states and knows next step.
- Actors: Learner, web app.
- Trigger:
  - Quiz generation cannot proceed due to insufficient eligible vocabulary.
  - New user has no saved vocabulary.
- Preconditions: Learner opens quiz/dashboard/vocabulary entry points.
- Main Flow:
  1. For no saved vocabulary, product guides user to capture flow.
  2. For quiz insufficiency, product informs learner clearly.
- Alternative Flows: Not specified in source documents.
- Inputs: Learner vocabulary state and quiz-generation attempt.
- Outputs: User-visible guidance/failure states.
- Product Rules:
  - No broken/empty unexplained screens.
- Error / Edge Cases: EDGE-009, EDGE-011.
- Dependencies: FEATURE-QUIZ-01, FEATURE-VOCAB-01, FEATURE-DASH-01.
- Acceptance Criteria:
  - Given new user with no saved vocabulary, when learner opens dashboard/vocabulary entry points, then product guides learner toward capture flow.
  - Quiz-insufficiency acceptance criteria cannot be finalized until minimum threshold and eligibility rule are decided.
- Source User Stories: US-058, US-059.
- Source Requirements: EDGE-009, EDGE-011.
- Open Decisions: DEC-05 and DEC-06 for quiz insufficiency criteria - Needs Product Decision.

### Edge Case Coverage (EDGE-001 through EDGE-011)

| Edge Case | Trigger | Expected Product Behavior | User-Visible Result | Recovery Possible | Traceability |
|---|---|---|---|---|---|
| EDGE-001 | Capture triggered with no selection | Do not send AI request | No analysis request proceeds | Yes (select text and retry) | FEATURE-EXT-01, US-010 |
| EDGE-002 | Selection too short/ambiguous | Indicate insufficient input | Learner sees insufficiency guidance | Yes (new selection) | FEATURE-EDGE-02, US-056 |
| EDGE-003 | Captured context insufficient for reliable explanation | Indicate uncertainty/insufficiency | Learner sees that result is not reliable | Yes (expand/change context selection) | FEATURE-EDGE-02, US-056 |
| EDGE-004 | AI request fails | Show clear failure state | Learner sees AI failure and can retry | Yes | FEATURE-EXT-02, US-016 |
| EDGE-005 | AI output unusable/malformed | Do not treat as valid explanation | Learner is not shown/saving unusable content as valid | Not fully specified in source docs | FEATURE-EDGE-01, US-055 |
| EDGE-006 | Save fails | Show clear save failure state | Learner informed save failed; no silent discard | Yes (retry save) | FEATURE-EXT-03, US-017 |
| EDGE-007 | Unauthenticated gated action | Prompt for authentication and block action | Learner asked to authenticate | Yes (authenticate) | FEATURE-AUTH-01, US-006 |
| EDGE-008 | Network failure during core action | Show clear failure indication | Learner informed action failed | Yes (retry when connection restored) | FEATURE-EDGE-03, US-057 |
| EDGE-009 | Quiz generation impossible due to insufficiency | Inform learner; no broken quiz | Learner sees clear insufficiency message | Yes after more eligible data; threshold unresolved | FEATURE-EDGE-04, US-058 |
| EDGE-010 | No vocabulary due for review | Show clear nothing-due state | Learner sees explicit no-due message | Yes (after future due items exist) | FEATURE-REVIEW-01, US-027 |
| EDGE-011 | New user has no saved vocabulary | Guide user to capture flow | Learner sees actionable onboarding guidance | Yes | FEATURE-EDGE-04, US-059 |

## 14. Cross-Feature Product Rules

### 14.1 Authentication boundary
- Save/view/review/quiz actions require authentication.

### 14.2 Extension and Web boundary
- Extension owns in-page selection and capture.
- Web app owns vocabulary management, review, quiz, dashboard, settings.

### 14.3 Context preservation
- Original context is preserved unless explicit user action changes/removes it.
- Exact editability scope remains unresolved (DEC-01).

### 14.4 Vocabulary Item / Meaning / Occurrence model
- Product must keep conceptual distinction across these three concepts.
- No flattening into one generic product concept.

### 14.5 AI contextual analysis
- Meaning and example are contextual to selected occurrence.
- Capability remains provider-agnostic.

### 14.6 Save behavior
- Save is one-action flow in extension.
- AI success is normal flow but not confirmed hard prerequisite for save in source docs.

### 14.7 Review behavior
- Review is performance-based.
- Scheduling algorithm is intentionally unspecified.

### 14.8 Quiz behavior
- MVP quiz type is Multiple Choice only.
- Exactly four options per question where specified.

### 14.9 Privacy boundary
- Capture starts from explicit selection only.
- Only minimum necessary context is captured/transmitted.
- No passive whole-page scanning/transmission.

## 15. Feature Dependencies

### Product-Level Dependency Map
Authentication
  -> Extension capture and save
  -> Vocabulary management
  -> Review
  -> Quiz
  -> Dashboard

Extension capture
  -> Contextual AI analysis
  -> Save vocabulary occurrence
  -> Open in Web handoff

Vocabulary management
  -> Review input pool
  -> Quiz input pool
  -> Dashboard metrics

Review
  -> Performance recording
  -> Next-review scheduling

Quiz
  -> Result recording
  -> Dashboard updates

### Dependency Types

| Dependency | Type | Notes |
|---|---|---|
| FEATURE-AUTH-01 -> FEATURE-EXT-03 | Hard product dependency | Save is auth-gated |
| FEATURE-AUTH-01 -> FEATURE-VOCAB-01/REVIEW-01/QUIZ-01/DASH-01 | Hard product dependency | Gated actions require authentication |
| FEATURE-EXT-01 -> FEATURE-EXT-02 | Normal flow relationship | AI analysis follows capture |
| FEATURE-EXT-02 -> FEATURE-EXT-03 | Normal flow relationship | AI output is normal flow but not confirmed hard save prerequisite |
| FEATURE-EXT-03 -> FEATURE-VOCAB-* | Hard product dependency | Vocabulary views require saved entries |
| FEATURE-VOCAB-01 -> FEATURE-REVIEW-01 | Hard product dependency | Review uses saved vocabulary |
| FEATURE-VOCAB-01 -> FEATURE-QUIZ-01 | Hard product dependency | Quiz generation needs vocabulary pool |
| FEATURE-QUIZ-03 -> FEATURE-DASH-02 | Hard product dependency | Quiz results feed dashboard |
| FEATURE-REVIEW-02 -> FEATURE-REVIEW-03 | Hard product dependency | Scheduling requires performance input model |
| FEATURE-REVIEW-03 scheduling details | Unresolved dependency | Algorithm intentionally unspecified |
| FEATURE-QUIZ-01 eligibility | Unresolved dependency | DEC-06 |
| FEATURE-DASH-03 progress definition | Unresolved dependency | FR-DASH-005/US-044 decision gap |
| FEATURE-SETTINGS-01 details | Unresolved dependency | DEC-08 |

## 16. Feature State / Readiness

Each feature has exactly one readiness state.

| Feature ID | Readiness |
|---|---|
| FEATURE-AUTH-01 | Ready |
| FEATURE-AUTH-02 | Needs Product Decision |
| FEATURE-EXT-01 | Ready |
| FEATURE-EXT-02 | Ready |
| FEATURE-EXT-03 | Ready |
| FEATURE-EXT-04 | Needs Product Decision |
| FEATURE-VOCAB-01 | Ready |
| FEATURE-VOCAB-02 | Ready |
| FEATURE-VOCAB-03 | Ready |
| FEATURE-VOCAB-04 | Needs Product Decision |
| FEATURE-VOCAB-05 | Needs Product Decision |
| FEATURE-REVIEW-01 | Ready |
| FEATURE-REVIEW-02 | Needs Product Decision |
| FEATURE-REVIEW-03 | Deferred |
| FEATURE-QUIZ-01 | Needs Product Decision |
| FEATURE-QUIZ-02 | Ready |
| FEATURE-QUIZ-03 | Ready |
| FEATURE-DASH-01 | Ready |
| FEATURE-DASH-02 | Ready |
| FEATURE-DASH-03 | Needs Product Decision |
| FEATURE-SETTINGS-01 | Needs Product Decision |
| FEATURE-PRIV-01 | Ready |
| FEATURE-PRIV-02 | Ready |
| FEATURE-AI-01 | Ready |
| FEATURE-EDGE-01 | Deferred |
| FEATURE-EDGE-02 | Needs Product Decision |
| FEATURE-EDGE-03 | Ready |
| FEATURE-EDGE-04 | Needs Product Decision |

Priority remains separate from readiness. Source stories are P0 while readiness varies.

## 17. Acceptance Criteria

Ready features in this document include observable Given/When/Then criteria in their feature sections.

For blocked/deferred features, final acceptance criteria cannot be completed until decisions are made:
- DEC-01 context editability
- DEC-02 repeated save/duplicate handling
- DEC-03 account-management action scope
- DEC-04 review performance model
- DEC-05 insufficient/ambiguous input and quiz insufficiency criteria
- DEC-06 quiz eligibility pool
- DEC-07 extension open-in-Web destination
- DEC-08 actual MVP settings
- FR-DASH-005/US-044 unlogged decision gap
- Deferred review scheduling algorithm decision (source-deferred)

## 18. Traceability Matrix

Complete story-level traceability from User Story to Feature to Requirement to Decision/Edge where applicable.

| User Story | Feature Specification | Requirement | Product Decision / Edge Case |
|---|---|---|---|
| US-001 | FEATURE-AUTH-01 | FR-AUTH-001 | - |
| US-002 | FEATURE-AUTH-01 | FR-AUTH-002 | - |
| US-003 | FEATURE-AUTH-01 | FR-AUTH-003 | - |
| US-004 | FEATURE-AUTH-01 | FR-AUTH-004 | - |
| US-005 | FEATURE-AUTH-02 | FR-AUTH-005 | DEC-03 |
| US-006 | FEATURE-AUTH-01 | FR-AUTH-006 | EDGE-007 |
| US-007 | FEATURE-EXT-01 | FR-EXT-001 | - |
| US-008 | FEATURE-EXT-01 | FR-EXT-002 | - |
| US-009 | FEATURE-EXT-01 | FR-EXT-003 | FR-EXT-012 boundary |
| US-010 | FEATURE-EXT-01 | FR-EXT-004 | EDGE-001 |
| US-011 | FEATURE-EXT-02 | FR-EXT-005 | EDGE-002/003 via FEATURE-EDGE-02 |
| US-012 | FEATURE-EXT-02 | FR-EXT-006 | - |
| US-013 | FEATURE-EXT-03 | FR-EXT-007 | - |
| US-014 | FEATURE-EXT-04 | FR-EXT-008 | DEC-07 |
| US-015 | FEATURE-EXT-02 | FR-EXT-009 | - |
| US-016 | FEATURE-EXT-02 | FR-EXT-010 | EDGE-004 |
| US-017 | FEATURE-EXT-03 | FR-EXT-011 | EDGE-006 |
| US-018 | FEATURE-EXT-01 | FR-EXT-012 | Privacy boundary |
| US-019 | FEATURE-VOCAB-01 | FR-VOCAB-001 | - |
| US-020 | FEATURE-VOCAB-01 | FR-VOCAB-002 | - |
| US-021 | FEATURE-VOCAB-01 | FR-VOCAB-003 | - |
| US-022 | FEATURE-VOCAB-04 | FR-VOCAB-004 | DEC-01 |
| US-023 | FEATURE-VOCAB-01 | FR-VOCAB-005 | - |
| US-024 | FEATURE-VOCAB-02 | FR-VOCAB-006 | DEC-01 linkage |
| US-025 | FEATURE-VOCAB-03 | FR-VOCAB-007 | - |
| US-026 | FEATURE-VOCAB-05 | FR-VOCAB-007 | DEC-02 |
| US-027 | FEATURE-REVIEW-01 | FR-REVIEW-001 | EDGE-010 |
| US-028 | FEATURE-REVIEW-01 | FR-REVIEW-002 | - |
| US-029 | FEATURE-REVIEW-01 | FR-REVIEW-003 | - |
| US-030 | FEATURE-REVIEW-02 | FR-REVIEW-004 | DEC-04 |
| US-031 | FEATURE-REVIEW-03 | FR-REVIEW-005 | DEC-04 + algorithm deferred |
| US-032 | FEATURE-QUIZ-01 | FR-QUIZ-001 | DEC-06 |
| US-033 | FEATURE-QUIZ-01 | FR-QUIZ-002 | - |
| US-034 | FEATURE-QUIZ-02 | FR-QUIZ-003 | - |
| US-035 | FEATURE-QUIZ-02 | FR-QUIZ-004 | - |
| US-036 | FEATURE-QUIZ-02 | FR-QUIZ-005 | - |
| US-037 | FEATURE-QUIZ-02 | FR-QUIZ-006 | - |
| US-038 | FEATURE-QUIZ-03 | FR-QUIZ-007 | - |
| US-039 | FEATURE-QUIZ-03 | FR-QUIZ-008 | - |
| US-040 | FEATURE-DASH-01 | FR-DASH-001 | - |
| US-041 | FEATURE-DASH-01 | FR-DASH-002 | - |
| US-042 | FEATURE-DASH-02 | FR-DASH-003 | - |
| US-043 | FEATURE-DASH-02 | FR-DASH-004 | - |
| US-044 | FEATURE-DASH-03 | FR-DASH-005 | Unlogged decision gap |
| US-045 | FEATURE-SETTINGS-01 | FR-SETTINGS-001, FR-SETTINGS-002 | DEC-08 |
| US-046 | FEATURE-PRIV-01 | FR-PRIV-001 | - |
| US-047 | FEATURE-PRIV-01 | FR-PRIV-002 | - |
| US-048 | FEATURE-PRIV-01 | FR-PRIV-003 | - |
| US-049 | FEATURE-PRIV-01 | FR-PRIV-004 | - |
| US-050 | FEATURE-PRIV-02 | FR-PRIV-005 | - |
| US-051 | FEATURE-PRIV-02 | FR-PRIV-006 | Retention policy still open |
| US-052 | FEATURE-AI-01 | REQ-AI-001 | - |
| US-053 | FEATURE-AI-01 | REQ-AI-002 | - |
| US-054 | FEATURE-AI-01 | REQ-AI-003 | Linked to DEC-06 for eligibility input |
| US-055 | FEATURE-EDGE-01 | EDGE-005 | Deferred detection specifics |
| US-056 | FEATURE-EDGE-02 | EDGE-002, EDGE-003 | DEC-05 |
| US-057 | FEATURE-EDGE-03 | EDGE-008 | - |
| US-058 | FEATURE-EDGE-04 | EDGE-009 | DEC-05 + DEC-06 |
| US-059 | FEATURE-EDGE-04 | EDGE-011 | - |

Requirement-family coverage check:
- FR-AUTH-* covered.
- FR-EXT-* covered.
- FR-VOCAB-* covered.
- FR-REVIEW-* covered.
- FR-QUIZ-* covered.
- FR-DASH-* covered.
- FR-SETTINGS-* covered.
- FR-PRIV-* covered.
- REQ-AI-* covered.
- EDGE-001 through EDGE-011 covered.

## 19. Product Decision Register

### Formally Logged Decisions

| Decision ID | Decision Topic | Affected Features | Status |
|---|---|---|---|
| DEC-01 | Context editability | FEATURE-VOCAB-04, FEATURE-VOCAB-02 | Open |
| DEC-02 | Repeated save / duplicate handling | FEATURE-VOCAB-05 | Open |
| DEC-03 | Account management actions | FEATURE-AUTH-02 | Open |
| DEC-04 | Review performance model | FEATURE-REVIEW-02, FEATURE-REVIEW-03 | Open |
| DEC-05 | Insufficient/ambiguous input and quiz insufficiency criteria | FEATURE-EDGE-02, FEATURE-EDGE-04 | Open |
| DEC-06 | Quiz eligibility pool | FEATURE-QUIZ-01, FEATURE-EDGE-04, FEATURE-AI-01 (input dependency) | Open |
| DEC-07 | Extension open-in-Web destination | FEATURE-EXT-04 | Open |
| DEC-08 | Actual MVP settings | FEATURE-SETTINGS-01 | Open |

### Unresolved Decision Gap (Not Formally Logged in Source)

| Gap | Affected Requirement / Story | Affected Feature | Status |
|---|---|---|---|
| FR-DASH-005 / US-044 progress-over-time definition (metrics/time range/representation) lacks formal DEC-ID in source docs | FR-DASH-005, US-044 | FEATURE-DASH-03 | Open, needs product decision |

No new DEC-ID is created in this document for the gap above.

## 20. Feature Quality Review

### Source Consistency
Pass. Feature specs align with Product Discovery, PRD, Requirements, and User Stories.

### Scope Control
Pass. No new product scope added.

### Completeness
Pass. Every US-001 through US-059 is mapped to at least one feature.

### Traceability
Pass. All required requirement families and EDGE-001 through EDGE-011 are represented.

### Readiness
Pass. Blocked/deferred features are explicitly marked with reasons.

### Acceptance Criteria
Pass with condition. Every Ready feature has testable criteria. Non-ready features explicitly state blocking decisions.

### Product-Level Boundary
Pass. No code, API, database, or technical architecture detail included.

### Privacy
Pass. Extension privacy boundary preserved throughout.

### AI
Pass. AI capability is provider-agnostic.

### Review
Pass. No scheduling/SRS algorithm chosen.

### Quiz
Pass. MVP quiz remains Multiple Choice only.

### Decisions
Pass. Unresolved decisions are explicitly listed, not silently resolved.

## 21. MVP Feature Summary

| Feature ID | Feature | Epic | Priority | Readiness | Source Stories | Open Decision |
|------------|---------|------|----------|-----------|----------------|---------------|
| FEATURE-AUTH-01 | Auth access lifecycle | EPIC-01 | P0 | Ready | US-001, US-002, US-003, US-004, US-006 | - |
| FEATURE-AUTH-02 | Basic account management scope | EPIC-01 | P0 | Needs Product Decision | US-005 | DEC-03 |
| FEATURE-EXT-01 | Selection detection and minimum-context capture | EPIC-02 | P0 | Ready | US-007, US-008, US-009, US-010, US-018 | - |
| FEATURE-EXT-02 | Contextual AI explanation and example in extension | EPIC-02 | P0 | Ready | US-011, US-012, US-015, US-016 | - |
| FEATURE-EXT-03 | Save captured vocabulary occurrence from extension | EPIC-02 | P0 | Ready | US-013, US-017 | - |
| FEATURE-EXT-04 | Extension to Web handoff destination | EPIC-02 | P0 | Needs Product Decision | US-014 | DEC-07 |
| FEATURE-VOCAB-01 | Vocabulary library viewing and grouping | EPIC-03 | P0 | Ready | US-019, US-020, US-021, US-023 | - |
| FEATURE-VOCAB-02 | Preserve occurrence context over time | EPIC-03 | P0 | Ready | US-024 | DEC-01 linkage |
| FEATURE-VOCAB-03 | Vocabulary Item / Meaning / Occurrence distinction | EPIC-03 | P0 | Ready | US-025 | - |
| FEATURE-VOCAB-04 | Edit saved vocabulary entry scope | EPIC-03 | P0 | Needs Product Decision | US-022 | DEC-01 |
| FEATURE-VOCAB-05 | Repeated save and duplicate behavior | EPIC-03 | P0 | Needs Product Decision | US-026 | DEC-02 |
| FEATURE-REVIEW-01 | Due review queue and flashcard interaction | EPIC-04 | P0 | Ready | US-027, US-028, US-029 | - |
| FEATURE-REVIEW-02 | Review performance input model | EPIC-04 | P0 | Needs Product Decision | US-030 | DEC-04 |
| FEATURE-REVIEW-03 | Performance-based next-review scheduling | EPIC-04 | P0 | Deferred | US-031 | DEC-04 + algorithm deferred |
| FEATURE-QUIZ-01 | Quiz generation eligibility and composition | EPIC-05 | P0 | Needs Product Decision | US-032, US-033 | DEC-06 |
| FEATURE-QUIZ-02 | Question answering, feedback, and explanation | EPIC-05 | P0 | Ready | US-034, US-035, US-036, US-037 | - |
| FEATURE-QUIZ-03 | Quiz result recording and stats update | EPIC-05 | P0 | Ready | US-038, US-039 | - |
| FEATURE-DASH-01 | Due count and recent activity visibility | EPIC-06 | P0 | Ready | US-040, US-041 | - |
| FEATURE-DASH-02 | Basic statistics and recent quiz result visibility | EPIC-06 | P0 | Ready | US-042, US-043 | - |
| FEATURE-DASH-03 | Progress-over-time visibility | EPIC-06 | P0 | Needs Product Decision | US-044 | Unlogged FR-DASH-005 gap |
| FEATURE-SETTINGS-01 | MVP settings definition and management | EPIC-07 | P0 | Needs Product Decision | US-045 | DEC-08 |
| FEATURE-PRIV-01 | Explicit-selection capture boundary | EPIC-08 | P0 | Ready | US-046, US-047, US-048, US-049 | - |
| FEATURE-PRIV-02 | Processing transparency and retention-status communication | EPIC-08 | P0 | Ready | US-050, US-051 | Retention specifics open |
| FEATURE-AI-01 | Product-level AI learning capabilities | EPIC-09 | P0 | Ready | US-052, US-053, US-054 | DEC-06 input dependency |
| FEATURE-EDGE-01 | Unusable AI content guardrail | EPIC-10 | P0 | Deferred | US-055 | Deferred detection specifics |
| FEATURE-EDGE-02 | Insufficient or ambiguous capture handling | EPIC-10 | P0 | Needs Product Decision | US-056 | DEC-05 |
| FEATURE-EDGE-03 | Network-failure handling across core actions | EPIC-10 | P0 | Ready | US-057 | - |
| FEATURE-EDGE-04 | Quiz-generation insufficiency handling and empty-state guidance | EPIC-10 | P0 | Needs Product Decision | US-058, US-059 | DEC-05, DEC-06 |

Summary totals (calculated from table above):
- Total features: 28
- Ready: 16
- Needs Clarification: 0
- Needs Product Decision: 10
- Deferred: 2

## 22. Final Specification Acceptance Criteria

- [x] docs/FEATURE-SPECS.md exists
- [x] All ten epics are represented
- [x] Every US-001 through US-059 is traceable
- [x] Every source requirement is traceable
- [x] No new product scope was invented
- [x] No technical architecture was introduced
- [x] No database schema was introduced
- [x] No API design was introduced
- [x] No SRS algorithm was chosen
- [x] MVP quiz remains Multiple Choice only
- [x] Extension privacy boundary is preserved
- [x] Vocabulary Item / Meaning / Occurrence distinction is preserved
- [x] AI remains provider-agnostic
- [x] AI success is not treated as a confirmed hard prerequisite for saving
- [x] Unresolved decisions are explicitly marked
- [x] Every Ready feature has testable acceptance criteria
- [x] Traceability is complete
- [x] Priority and Readiness remain separate
