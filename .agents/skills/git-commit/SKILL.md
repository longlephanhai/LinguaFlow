---
name: git-commit
description: Use when staging changes, crafting conventional commit messages, and creating clean git checkpoints.
---

# Git Commit Skill

When performing git operations and creating commits:

1. **Pre-commit Check:**
   - Run `git status` and `git diff` to review all staged and unstaged changes.
   - Verify no temporary files (`.env`, `node_modules`, build artifacts, or debug logs) are staged.
   - Ensure no hardcoded secrets or API keys are present in the diff.

2. **Commit Message Format:**
   Follow Conventional Commits specification: `type(scope): concise imperative description`
   - `feat`: New feature (e.g., `feat(extension): add selection capture popup`)
   - `fix`: Bug fix (e.g., `fix(auth): handle token refresh 401 error`)
   - `docs`: Documentation updates (e.g., `docs(prd): update MVP scope`)
   - `refactor`: Code change that neither fixes a bug nor adds a feature
   - `test`: Adding or updating tests
   - `chore`: Maintenance, config, or dependency updates

3. **Changelog Sync:**
   - If this commit completes an item listed in `@docs/PRD.md`, update `@docs/CHANGELOG.md` by moving the completed item to the `Done` section before finalizing the commit.