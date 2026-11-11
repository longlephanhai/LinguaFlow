# LinguaFlow Engineering Team (`linguaflow-team`)

Plugin tổ chức đội ngũ Multi-Agent & Sub-agent chuyên trách cho dự án **LinguaFlow**.

## Thành phần đội ngũ

| Agent | Vai trò | Phạm vi quyền & Workspace |
|---|---|---|
| `linguaflow-architect` | Phân tích PRD, Architecture, Data Schema & API Contracts | Read-only (`read_file`, `run_command`) |
| `linguaflow-backend` | NestJS Monolith, Mongoose 3 tầng, `AiModule` | Write (`backend/`, `docs/API-CONTRACTS.md`, `docs/DATA-SCHEMA.md`) |
| `linguaflow-frontend` | Web React/Mantine v7 & Chrome Extension MV3 | Write (`frontend/`, `extension/`) |
| `linguaflow-qa` | Vitest Unit & E2E Tests, `AIProvider` & Chrome mocks | Write tests + run test suites |
| `linguaflow-auditor` | Kiểm tra diff độc lập theo `PROJECT-RULES.md` & Bảo mật | Read-only (`read_file`, `run_command`) |

## Skills đi kèm

- `team-orchestration`: Playbook điều phối Coordinator → Sub-agents (`invoke_subagent`) hoặc Swarm (`swarm`).
- `team-pre-commit`: Cổng kiểm tra song song `linguaflow-qa` + `linguaflow-auditor` trước khi commit.

