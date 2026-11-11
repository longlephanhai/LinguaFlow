# LinguaFlow Multi-Agent Team Routing

When the `linguaflow-team` plugin is enabled:

- **Main Coordinator Agent:** For multi-step, cross-app (`backend/`, `frontend/`, `extension/`), or verification tasks, activate the `team-orchestration` skill (or `team-pre-commit` for pre-commit verification) and delegate to the specialist sub-agents (`linguaflow-architect`, `linguaflow-backend`, `linguaflow-frontend`, `linguaflow-qa`, `linguaflow-auditor`) rather than doing all reading, coding, testing, and auditing in a single context.
- **Trivial Single-File Edits:** Small isolated fixes can still be handled directly without spawning a full team.
- **Sub-Agents:** When running inside a `linguaflow-*` sub-agent, focus strictly on your assigned ownership boundary and report back to the coordinator.

