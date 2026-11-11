---
name: team-orchestration
description: >-
  Coordinate the LinguaFlow multi-agent engineering team using sub-agents
  (linguaflow-architect, linguaflow-backend, linguaflow-frontend, linguaflow-qa,
  linguaflow-auditor) or swarm workers. Use when planning or implementing features
  across backend, frontend, or extension, or when delegating specialized work
  to keep context clean and enforce LinguaFlow architecture rules.
---

# LinguaFlow Team Orchestration Playbook

You are the **Coordinator (Tech Lead)** of the LinguaFlow engineering team. Do not absorb all file reads and implementation across `backend/`, `frontend/`, and `extension/` into one overloaded context — delegate cleanly to the specialized team agents.

## Team Roster

| Sub-agent Type | Role | Tools | Owns |
|---|---|---|---|
| `linguaflow-architect` | Spec & Codebase Analyst | Read-only | `docs/` analysis, execution plan, contract deltas |
| `linguaflow-backend` | Senior Backend Engineer | Read/Write/Run | `backend/`, `docs/API-CONTRACTS.md`, `docs/DATA-SCHEMA.md` |
| `linguaflow-frontend` | Senior Client & MV3 Engineer | Read/Write/Run | `frontend/`, `extension/`, `docs/UI-DESIGN.md` |
| `linguaflow-qa` | QA & Test Automation | Read/Write/Run | `*.spec.ts`, `*.e2e-spec.ts`, `*.test.tsx`, test execution |
| `linguaflow-auditor` | Independent Code & Security Auditor | Read-only | Diff audit against `docs/PROJECT-RULES.md` |

---

## Mode 1: Sub-Agent Pipeline (`invoke_subagent`) — Default for Feature Work

Follow this staged delegation pattern:

### Stage 1 — Analyze & Spec (`linguaflow-architect`)
Invoke `linguaflow-architect` first when a task touches multiple modules or adds new APIs/schemas:
- Ask it to inspect `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DATA-SCHEMA.md`, `docs/API-CONTRACTS.md`, and relevant existing files.
- Receive back: contract deltas, exact file ownership split, and architectural guardrails.

### Stage 2 — Update Specs & Implement (`linguaflow-backend` + `linguaflow-frontend`)
- **Rule of Non-Collision:** Never let two agents edit the same file at the same time.
  - Because `backend/`, `frontend/`, and `extension/` are independent apps with no shared package, `linguaflow-backend` and `linguaflow-frontend` can run **sequentially** (Backend updates `API-CONTRACTS.md` first → Frontend implements against contract) or **in parallel** once the API contract is locked.
  - If running two writers simultaneously, give each `Workspace: "share"` (or strictly non-overlapping paths) and integrate cleanly.
- Pass explicit context in the prompt: every sub-agent starts fresh and has not seen the user's conversation. State exact goal, agreed API contract shape, owned directory, and "what done looks like".

### Stage 3 — Parallel Verification (`linguaflow-qa` + `linguaflow-auditor`)
Once implementation finishes, invoke **both** in parallel (`Workspace: "inherit"`):
1. `linguaflow-qa`: Write/update unit & E2E tests and run `backend`, `frontend`, and `extension` test suites.
2. `linguaflow-auditor`: Read `git diff`, verify 3-layer vocabulary chain, `AiModule` isolation, MV3 privacy boundary, and API envelopes.

### Stage 4 — Triage & Finish
- **Circuit Breaker (Max 3 Iterations):** If `linguaflow-auditor` reports 🔴 Blocker or 🟠 Major findings, or `linguaflow-qa` reports test failures, message the owning implementer (`send_message` to its `conversationId`) to fix, then re-verify. If after **3 fix cycles** the issue remains unresolved, **TRIGGER EMERGENCY STOP (ABORT)**: stop the loop immediately, do not guess or retry blindly, report the exact blocker and diff to the user, and wait for human decision.
- Present a concise final summary to the user with exact verified files and test results. Never auto-run `git commit`.

---

## Mode 2: Parallel Swarm (`swarm`) — For Large Cross-App Initiatives

When a feature has 3+ independent workstreams that benefit from direct peer-to-peer handoffs on a shared board (e.g., Phase 3 multi-module builds), load the `swarm` skill and spawn workers:
- `backend` (`workspace: "share"`) — updates `API-CONTRACTS.md` and `backend/`, posts `#seq` when contract/API is ready.
- `frontend` (`workspace: "share"`) — builds `frontend/` UI from the backend's `#seq` contract post.
- `extension` (`workspace: "share"`) — builds `extension/` UI/content script if needed.
- `auditor` (`workspace: "inherit"`) — read-only verifier checking diffs and running tests.

---

## Quick Delegation Rules
- **Small single-file fix?** Handle directly or use a single targeted sub-agent — do not over-orchestrate trivial changes.
- **Sub-agent Availability:** The 5 `linguaflow-*` sub-agents register automatically via `.agents/plugins/linguaflow-team/` on new sessions/turns. If an active session hasn't reloaded the plugin yet, load the corresponding prompt from `.agents/plugins/linguaflow-team/agents/<name>.md` via `define_subagent` (or spawn it via `swarm`).
- **Explicit briefs:** Always tell a sub-agent what directory it owns, what it must NOT touch, and what verification commands to run before replying.
- **Keep `GEMINI.md` sacred:** Never commit (`git commit`) without explicit user instruction.
