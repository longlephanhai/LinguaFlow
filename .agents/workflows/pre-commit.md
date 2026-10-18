---
description: Pre-Commit Check & Commit Workflow
---

Execute quality checks and commit staged changes.

## Steps

1. Activate skill `code-review` to inspect all pending changes against `@docs/PROJECT-RULES.md`.
2. Activate skill `write-test` and execute `npm --prefix backend test && npm --prefix frontend test -- --run` to ensure zero breaking changes across both backend and frontend.
3. If tests pass and review is clean, activate skill `git-commit` to stage files, update `@docs/CHANGELOG.md`, and prompt for commit confirmation.