# Role And Permission Discussion

## Permission Model

AI Ticket OS uses RBAC with enterprise data scopes.

- Menu permission controls page visibility.
- Action permission controls page-level operations.
- Data permission controls organization, team, tenant, customer tier, and channel visibility.
- API permission controls external platform access.
- Audit permission controls access to sensitive logs and security events.

## Default Roles

- Super Admin: full system, tenant, role, API, audit, and integration access.
- Operations Admin: support operations, SLA, risk, alert, and workforce access.
- Support Lead: team queues, performance, quality review, and escalation access.
- Agent: assigned work, knowledge search, customer context, and AI assistant access.
- AI Ops Admin: AI agents, workflows, prompts, models, evaluations, costs, and traces.
- Knowledge Manager: knowledge base, FAQ, RAG, vector store, and review workflow access.
- Auditor: read-only access to logs, permissions, and security reports.

## Sensitive Controls

- Live call monitor, whisper, barge-in, and force disconnect require elevated permissions.
- Model routing, token budget, API keys, webhooks, and tenant settings require administrator approval.
- Audit exports and customer data exports should be logged and reviewable.
