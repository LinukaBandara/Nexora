# NEXORA ERP

NEXORA is a hybrid ERP platform for businesses that need cloud operations, on-premise control, and reliable synchronization between local and cloud nodes.

## Architecture
- ASP.NET Core / .NET 10 backend
- PostgreSQL + Entity Framework Core
- Next.js frontend in apps/web
- Docker-based infrastructure
- JWT authentication, refresh-token rotation, and RBAC

## Implemented modules
- Multi-tenant organizations and branch isolation
- Authentication, permissions, and audit logging
- Inventory with an append-only stock movement ledger
- Quotation -> sales order -> invoice -> payment workflows
- Purchasing and split goods receiving
- Receivables/payables and finance summaries
- Document immutability rules
- Notifications and analytics dashboards
- Hybrid outbox-based synchronization with conflict policies
- Core frontend authentication/proxy flow and screens

## Development
Use the Docker compose configuration under infrastructure/docker for the full local stack.

Backend tests:
dotnet test tests/unit/Nexora.UnitTests/Nexora.UnitTests.csproj
dotnet test tests/integration/Nexora.IntegrationTests/Nexora.IntegrationTests.csproj

See docs/ for architecture and module documentation.

## Roadmap
HR/payroll, further frontend coverage, production hardening, advanced charting, and NEXORA Intelligence remain on the roadmap.
