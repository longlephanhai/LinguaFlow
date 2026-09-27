---
name: git-commit
description: Use when staging changes, crafting conventional commit messages, and creating clean git checkpoints.
---

# Git Commit Skill

When performing git operations and creating commits:

1. **Pre-commit Inspection & Safety:**
   - Run `git status` and `git diff` to inspect changes.
   - Verify that no sensitive files (`.env`, credentials, API keys) or build artifacts (`node_modules/`, dist, logs) are staged or modified unsafely.
   - Separate unrelated changes into atomic commits instead of committing everything at once.

2. **Changelog & Documentation Sync (If applicable):**
   - If this change resolves or completes a task from `@docs/PRD.md`, update `@docs/CHANGELOG.md` (e.g., move the item to the `Done` section).
   - Stage the specific modified files: use selective `git add <file_paths>`, strictly avoid `git add .` unless all changes belong to the same scope.

3. **Commit Message Format:**
   Follow Conventional Commits specification: `<type>(<scope>): <short imperative description>`
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation updates
   - `refactor`: Code restructuring without functional changes
   - `test`: Adding or modifying tests
   - `chore`: Dependency, build, or configuration updates
   - Use lowercase, imperative mood (e.g., `fix(auth): handle token refresh 401 error`).

4. **Execution Boundaries:**
   - Run `git commit -m "..."`.
   - Never run `git push` unless explicitly instructed by the user.