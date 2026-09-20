---
trigger: always_on
---

# Master Rules Router

Before executing any task, always reference and strictly adhere to the authoritative specs in the `docs/` directory:

1. **Coding Standards, Security & Manifest V3:** Read and apply `@docs/PROJECT-RULES.md`.
2. **Data Model & Mongoose Schemas:** Read and enforce `@docs/DATA-SCHEMA.md` (NEVER flatten the 3-layer structure).
3. **API Contracts & DTOs:** Read and match `@docs/API-CONTRACTS.md`.
4. **Architecture & AI Boundaries:** Read `@docs/ARCHITECTURE.md` (all AI calls must go through `AiModule`).