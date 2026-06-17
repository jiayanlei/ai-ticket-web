# Route Feature Requirements

This document defines the required business capabilities for each AI Ticket OS route. The goal is to make each module feel like an independent product surface instead of repeating the same generic dashboard layout.

## Design Rule

- Each route must have a clear business job, not only metrics and charts.
- Shared layout is allowed, but the core workspace, actions, filters, tables, side panels, and empty states must match the route's business scenario.
- New features should be implemented with minimal page-level changes first. Do not introduce new architecture unless a page cannot be maintained without it.

## Smart Workspace

| Route | Module | Required Functions | UI Difference |
| --- | --- | --- | --- |
| `/dashboard/workbench` | Dashboard | Global service overview, aggregated todos, SLA risk, AI intervention summary, queue pressure, quick actions, command screen entry. | Executive command workspace with KPI strips, risk cards, todo queue, and cross-module shortcuts. |

## Service Center

| Route | Module | Required Functions | UI Difference |
| --- | --- | --- | --- |
| `/service/tickets` | Ticket Center | Ticket list, search and filters, create ticket, assign, transfer, escalate, merge, split, link customer, link conversation, lifecycle timeline, AI handling recommendation. | Ticket operations table plus lifecycle board, SLA countdown, priority tags, relation graph, and action drawer. |
| `/service/calls` | Call Center | Live call queue, agent state, incoming call context, IVR flow, recording records, monitor, whisper, barge-in, disconnect, AI real-time assist, call QA result. | Realtime call console with queue lanes, call control bar, agent wall, IVR map, and risk call highlight. |
| `/service/live-chat` | Live Chat Center | Conversation hall, customer context, bot handling, human takeover, multi-session workspace, AI reply drafts, knowledge recommendations, satisfaction result. | Three-column chat workbench: session list, message panel, customer and AI assistant side panel. |

## Omnichannel Center

| Route | Module | Required Functions | UI Difference |
| --- | --- | --- | --- |
| `/omnichannel/email` | Email Center | Priority inbox, thread merge, category classification, AI summary, AI draft, approval before send, attachments, first-response SLA, convert email to ticket. | Mail-style thread workspace with inbox list, reading pane, draft studio, and attachment area. |
| `/omnichannel/sms` | SMS Center | SMS task list, template management, sending plan, notification/OTP/marketing categories, delivery status, retry failed sends, delivery analytics, unsubscribe compliance. | Campaign/task console with template preview, delivery funnel, retry queue, and compliance status. |
| `/omnichannel/inbox` | Unified Inbox | Cross-channel inbox, channel filter, customer aggregation, unified assignment, message-to-ticket conversion, duplicate message merge, AI intent detection. | Unified message triage board with channel badges, customer grouping, and assignment queue. |

## Agent Operations

| Route | Module | Required Functions | UI Difference |
| --- | --- | --- | --- |
| `/operations/agents` | Agent Center | Agent profile, online state, skill group, workload capacity, current tasks, performance snapshot, schedule relation, permission state. | Agent roster with status wall, skill filters, capacity bars, and agent detail drawer. |
| `/operations/scheduling` | Workforce Scheduling | Shift calendar, skill group schedule, peak forecast, staffing gap alert, leave request, shift swap, conflict detection, AI schedule suggestion. | Calendar and staffing grid with demand curve, gap markers, and conflict panel. |
| `/operations/performance` | Performance Center | Agent metrics, team comparison, handled volume, first response, resolution rate, CSAT, QA score, ranking, trend comparison. | Performance scorecard with leaderboard, comparison charts, and metric drill-down. |
| `/operations/quality` | AI Quality Inspection | QA sample list, AI QA score, violation items, sentiment and script analysis, appeal review, QA rules, correction tracking. | QA review workspace with evidence timeline, score breakdown, rule hits, and appeal status. |
| `/operations/training` | Training Center | Training courses, learning tasks, knowledge tests, weakness recommendations, progress tracking, exam result, agent capability profile. | Learning dashboard with course cards, task progress, test results, and capability radar. |

## Customer Center

| Route | Module | Required Functions | UI Difference |
| --- | --- | --- | --- |
| `/customers/360` | Customer 360 | Customer profile, basic info, ticket history, conversation history, call history, email history, order/contract summary, risk tags, customer value, next-best action. | Customer profile cockpit with timeline, relationship cards, risk/value tags, and interaction history. |
| `/customers/journey` | Customer Journey | Journey timeline, touchpoint map, lifecycle stage, key events, sentiment changes, churn risk, service intervention suggestions. | Journey map with stage lanes, touchpoint nodes, sentiment curve, and intervention panel. |

## Knowledge Center

| Route | Module | Required Functions | UI Difference |
| --- | --- | --- | --- |
| `/knowledge/base` | Knowledge Base | Knowledge catalog, article management, FAQ, version status, review and publish, search, reference count, hit rate, knowledge gap discovery. | Knowledge management workspace with tree catalog, article list, editor/detail panel, and review status. |

## AI Capability Center

| Route | Module | Required Functions | UI Difference |
| --- | --- | --- | --- |
| `/ai/agents` | AI Agent Center | AI agent list, enable/disable state, capability scope, channel binding, takeover rules, performance metrics, human fallback config. | AI agent operations board with capability cards, channel bindings, fallback rules, and outcome metrics. |
| `/ai/workflows` | AI Workflow Center | Workflow list, node orchestration, trigger conditions, execution records, publish, rollback, failure alert, workflow impact metrics. | Workflow canvas with node list, run history, publish status, and failure diagnostics. |
| `/ai/prompts` | AI Prompt Center | Prompt templates, version management, variables, scenario binding, test run, effect score, publish approval. | Prompt lab with template list, editor, variable panel, test result, and version timeline. |
| `/ai/models` | AI Model Center | Model list, routing strategy, cost summary, request volume, latency, failure rate, budget limit, gray release strategy. | Model routing console with cost/latency cards, routing rules, budget status, and release controls. |

## Analytics

| Route | Module | Required Functions | UI Difference |
| --- | --- | --- | --- |
| `/analytics/operations` | Operations Analytics | Operations metrics, channel trend, team workload, handling efficiency, SLA trend, abnormal dimension drill-down. | Analysis dashboard with filter bar, metric tree, trend matrix, and drill-down table. |
| `/analytics/bi` | BI Reports | Report list, custom filters, chart configuration, export, scheduled report, metric definition notes. | BI report center with report catalog, saved views, export actions, and metric glossary. |
| `/analytics/cockpit` | Data Cockpit | Executive KPI, command screen entry, real-time trend, risk posture, key module navigation. | Cockpit-style overview with large KPI panels, realtime charts, risk wall, and big-screen entry. |
| `/analytics/sla` | SLA Management | SLA policies, level rules, countdown, timeout warning, breach statistics, remediation action, effective scope. | SLA control table with policy editor, countdown states, breach distribution, and remediation queue. |
| `/analytics/risk` | Risk Warning | Risk events, churn risk, complaint escalation, sentiment anomaly, risk level, closed-loop handling. | Risk command board with severity lanes, event timeline, owner status, and closure evidence. |
| `/analytics/monitoring` | System Monitoring | Service health, API latency, error rate, queue backlog, AI call status, alert subscription, runtime log entry. | Monitoring dashboard with health tiles, latency charts, queue meters, and log shortcuts. |
| `/analytics/alerts` | Alert Center | Alert list, severity, acknowledge, close, notification rule, related object, handling record, duplicate alert grouping. | Alert operations table with severity filters, acknowledgment actions, related object drawer, and noise grouping. |

## System Management

| Route | Module | Required Functions | UI Difference |
| --- | --- | --- | --- |
| `/system/permissions` | Permission Center | Role management, menu permission, action permission, data scope, permission assignment, sensitive permission preview. | RBAC workspace with role list, permission tree, data scope panel, and permission preview. |
| `/system/audit` | Audit Center | Operation logs, login logs, sensitive action audit, trace filters, export, audit detail, abnormal behavior marker. | Audit search console with log table, advanced filters, trace detail drawer, and risk labels. |
| `/system/management` | System Management | Organization, department, users, system parameters, dictionaries, business switches, basic platform configuration. | Admin configuration center with grouped settings tabs and clear ownership by config type. |
| `/system/open-platform` | Open Platform | API applications, key management, webhook configuration, callback logs, API call volume, rate limit status, integration settings. | Developer platform console with app cards, API key drawer, webhook logs, and quota status. |

## Extension Route

| Route | Module | Required Functions | UI Difference |
| --- | --- | --- | --- |
| `/tenants` | Tenant Center | Tenant list, tenant creation, tenant detail, tenant configuration, organizations, members, role permissions, resource limits, lifecycle status, security audit. | Tenant Center page under the independent Tenant Management navigation group, with tenant table, status flow, setup checklist, resource cards, member/permission tabs, and audit timeline. |

## Tenant Center Detail

Tenant Management is an independent top-level navigation group. Tenant Center is the page inside it for managing tenant lifecycle, and it is not part of System Management.

Required lifecycle states:

- Draft
- Initializing
- Enabled
- Frozen
- Disabled
- Restored
- Archived

Required page areas:

- Tenant list with name, code, status, administrator, organization count, user count, service state, and creation time.
- Tenant creation flow with base info, tenant administrator, default organization, enabled modules, and initial permission template.
- Tenant detail with overview, organization structure, members, roles, permissions, business settings, resource usage, and audit records.
- Tenant settings for language, time zone, service channels, default SLA policy, AI capability switch, knowledge scope, and ticket rules.
- Organization and member management for departments, teams, agents, administrators, invitations, and account enable/disable.
- Permission isolation for tenant-level roles, menu permissions, action permissions, data scopes, and cross-tenant access restrictions.
- Resource controls for users, AI agents, knowledge storage, API calls, and channel access.
- Security audit for tenant switching, permission changes, administrator operations, sensitive exports, and configuration changes.
