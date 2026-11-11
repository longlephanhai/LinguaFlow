---
name: team-pre-commit
description: >-
  Multi-agent pre-commit verification workflow for LinguaFlow. Spawns
  linguaflow-qa and linguaflow-auditor sub-agents in parallel to run tests,
  linting, and independent security/architecture review before preparing
  a commit summary for user approval.
---

# Team Pre-Commit Gate

Use this skill before committing changes (replacing single-agent sequential checking with parallel specialist verification).

## Steps

1. **Quick Diff Check (Coordinator):**
   Run `git status --short` to see which apps (`backend/`, `frontend/`, `extension/`, `docs/`) have pending modifications.

2. **Parallel Sub-Agent Verification:**
   Invoke both sub-agents simultaneously in the same turn:
   - **`linguaflow-qa`** (`TypeName: "linguaflow-qa"`, `Role: "QA Test Runner"`):
     Instruct it to run lint and tests for every modified app:
     - `npm --prefix backend run lint && npm --prefix backend test` (plus `test:e2e` if backend endpoints changed)
     - `npm --prefix frontend run lint && npm --prefix frontend test -- --run`
     - `npm --prefix extension test` (if `extension/` changed)
     Report exact counts and any failures.
   - **`linguaflow-auditor`** (`TypeName: "linguaflow-auditor"`, `Role: "Code & Security Auditor"`):
     Instruct it to audit `git diff` against `docs/PROJECT-RULES.md`, `docs/DATA-SCHEMA.md`, `docs/API-CONTRACTS.md`, and `docs/ARCHITECTURE.md`, and return grouped findings (🔴 Blocker → 🟠 Major → 🟡 Minor) plus an explicit `APPROVE` / `CHANGES REQUESTED` verdict.

3. **Gate Decision:**
   - If any test fails or `linguaflow-auditor` returns `CHANGES REQUESTED` (🔴/🟠), stop and report blockers (or delegate fixes to `linguaflow-backend` / `linguaflow-frontend`).
   - If tests pass and verdict is `APPROVE`, activate skill `git-commit` to inspect `docs/CHANGELOG.md` sync, prepare selective staging guidance, and ask the user for explicit confirmation before running any `git commit` (per `.agents/rules/GEMINI.md`).

